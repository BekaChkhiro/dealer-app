const pool = require('../config/db');
const { uploadToR2, deleteFromR2 } = require('../config/r2');
const { logAudit } = require('../helpers/auditLog');

const ALLOWED_SORT_COLUMNS = [
  'id', 'buyer', 'mark', 'model', 'year', 'vin', 'lot_number', 'auction',
  'line', 'current_status', 'purchase_date', 'create_date', 'vehicle_price',
  'total_price', 'payed_amount', 'debt_amount', 'destination_port',
  'receiver_fullname', 'container_number', 'dealer_fee',
];
const ALLOWED_ORDER = ['asc', 'desc'];

function extractR2Key(url) {
  if (!url) return null;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (publicUrl && url.startsWith(publicUrl)) {
    return url.slice(publicUrl.length + 1);
  }
  return null;
}

async function getVehicles(req, res) {
  try {
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * limit;
    const keyword = req.query.keyword || '';
    const sortBy = ALLOWED_SORT_COLUMNS.includes(req.query.sort_by) ? req.query.sort_by : 'id';
    const order = ALLOWED_ORDER.includes(req.query.asc) ? req.query.asc : 'desc';
    const { auction, line, status, paid, start_date, end_date, dealer_id } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (keyword) {
      conditions.push(`(vin ILIKE $${paramIndex} OR buyer ILIKE $${paramIndex} OR mark ILIKE $${paramIndex} OR model ILIKE $${paramIndex} OR receiver_fullname ILIKE $${paramIndex} OR lot_number ILIKE $${paramIndex})`);
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (auction) {
      conditions.push(`auction = $${paramIndex}`);
      params.push(auction);
      paramIndex++;
    }

    if (line) {
      conditions.push(`line = $${paramIndex}`);
      params.push(line);
      paramIndex++;
    }

    if (status) {
      conditions.push(`current_status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (paid) {
      if (paid === 'paid') {
        conditions.push(`is_fully_paid = true`);
      } else if (paid === 'unpaid') {
        conditions.push(`is_fully_paid = false AND is_partially_paid = false`);
      } else if (paid === 'partial') {
        conditions.push(`is_partially_paid = true`);
      }
    }

    if (start_date) {
      conditions.push(`purchase_date >= $${paramIndex}`);
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      conditions.push(`purchase_date <= $${paramIndex}`);
      params.push(end_date);
      paramIndex++;
    }

    if (dealer_id) {
      conditions.push(`dealer_id = $${paramIndex}`);
      params.push(dealer_id);
      paramIndex++;
    }

    // Non-admin users only see their own vehicles
    if (req.session.user.role !== 'admin') {
      conditions.push(`dealer_id = $${paramIndex}`);
      params.push(req.session.user.id);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM vehicles ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT * FROM vehicles ${whereClause} ORDER BY ${sortBy} ${order} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({ error: 0, success: true, data: dataResult.rows, total });
  } catch (err) {
    console.error('getVehicles error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function createVehicle(req, res) {
  try {
    const {
      buyer, dealer_id, receiver_fullname, receiver_identity_number,
      mark, model, year, vin, lot_number, auction, receiver_phone,
      us_state, destination_port, us_port, is_sublot, is_fully_paid,
      is_partially_paid, is_funded, is_insured, doc_type,
      container_cost, landing_cost, vehicle_price, total_price,
      payed_amount, debt_amount, container_number, line, current_status,
      vehicle_pickup_date, warehouse_receive_date, container_loading_date,
      estimated_receive_date, receive_date, booking, dealer_fee,
      status_color, buyer_number, has_key, has_auction_image,
      has_transportation_image, has_port_image, has_poti_image,
      is_hybrid, vehicle_type, container_open_date, container_receive_date,
      receiver_changed, receiver_change_date, driver_fullname,
      driver_phone, driver_car_license_number, purchase_date,
      driver_company, late_car_payment,
    } = req.body;

    let profile_image_url = null;
    if (req.file) {
      const key = `cars/${Date.now()}_${lot_number || 'unknown'}_${req.file.originalname}`;
      profile_image_url = await uploadToR2(req.file.buffer, key, req.file.mimetype);
    }

    const result = await pool.query(
      `INSERT INTO vehicles (
        buyer, dealer_id, receiver_fullname, receiver_identity_number,
        mark, model, year, vin, lot_number, auction, receiver_phone,
        us_state, destination_port, us_port, is_sublot, is_fully_paid,
        is_partially_paid, is_funded, is_insured, doc_type,
        container_cost, landing_cost, vehicle_price, total_price,
        payed_amount, debt_amount, container_number, line, current_status,
        vehicle_pickup_date, warehouse_receive_date, container_loading_date,
        estimated_receive_date, receive_date, booking, dealer_fee,
        status_color, buyer_number, has_key, profile_image_url,
        has_auction_image, has_transportation_image, has_port_image,
        has_poti_image, is_hybrid, vehicle_type, container_open_date,
        container_receive_date, receiver_changed, receiver_change_date,
        driver_fullname, driver_phone, driver_car_license_number,
        purchase_date, driver_company, late_car_payment
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
        $41, $42, $43, $44, $45, $46, $47, $48, $49, $50,
        $51, $52, $53, $54, $55, $56
      ) RETURNING *`,
      [
        buyer, dealer_id, receiver_fullname, receiver_identity_number,
        mark, model, year, vin, lot_number, auction, receiver_phone,
        us_state, destination_port, us_port, is_sublot, is_fully_paid,
        is_partially_paid, is_funded, is_insured, doc_type,
        container_cost, landing_cost, vehicle_price, total_price,
        payed_amount, debt_amount, container_number, line, current_status,
        vehicle_pickup_date, warehouse_receive_date, container_loading_date,
        estimated_receive_date, receive_date, booking, dealer_fee,
        status_color, buyer_number, has_key, profile_image_url,
        has_auction_image, has_transportation_image, has_port_image,
        has_poti_image, is_hybrid, vehicle_type, container_open_date,
        container_receive_date, receiver_changed, receiver_change_date,
        driver_fullname, driver_phone, driver_car_license_number,
        purchase_date, driver_company, late_car_payment,
      ]
    );

    logAudit({ userId: req.session.user.id, entityType: 'vehicle', entityId: result.rows[0].id, action: 'CREATE', oldValues: null, newValues: result.rows[0], ipAddress: req.ip });
    res.status(201).json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createVehicle error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function updateVehicle(req, res) {
  try {
    const { id } = req.params;

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

    // Capture old state for audit
    const oldRecord = await pool.query('SELECT * FROM vehicles WHERE id = $1', [id]);

    // Handle image upload
    if (req.file) {
      if (oldRecord.rows[0]?.profile_image_url) {
        const oldKey = extractR2Key(oldRecord.rows[0].profile_image_url);
        if (oldKey) {
          deleteFromR2(oldKey).catch(err => console.error('Failed to delete old image from R2:', err));
        }
      }
      const key = `cars/${Date.now()}_${req.body.lot_number || 'unknown'}_${req.file.originalname}`;
      const imageUrl = await uploadToR2(req.file.buffer, key, req.file.mimetype);
      fields.push(`profile_image_url = $${paramIndex}`);
      params.push(imageUrl);
      paramIndex++;
    }

    const {
      buyer, dealer_id, receiver_fullname, receiver_identity_number,
      mark, model, year, vin, lot_number, auction, receiver_phone,
      us_state, destination_port, us_port, is_sublot, is_fully_paid,
      is_partially_paid, is_funded, is_insured, doc_type,
      container_cost, landing_cost, vehicle_price, total_price,
      payed_amount, debt_amount, container_number, line, current_status,
      vehicle_pickup_date, warehouse_receive_date, container_loading_date,
      estimated_receive_date, receive_date, booking, dealer_fee,
      status_color, buyer_number, has_key, has_auction_image,
      has_transportation_image, has_port_image, has_poti_image,
      is_hybrid, vehicle_type, container_open_date, container_receive_date,
      receiver_changed, receiver_change_date, driver_fullname,
      driver_phone, driver_car_license_number, purchase_date,
      driver_company, late_car_payment,
    } = req.body;

    addField('buyer', buyer);
    addField('dealer_id', dealer_id);
    addField('receiver_fullname', receiver_fullname);
    addField('receiver_identity_number', receiver_identity_number);
    addField('mark', mark);
    addField('model', model);
    addField('year', year);
    addField('vin', vin);
    addField('lot_number', lot_number);
    addField('auction', auction);
    addField('receiver_phone', receiver_phone);
    addField('us_state', us_state);
    addField('destination_port', destination_port);
    addField('us_port', us_port);
    addField('is_sublot', is_sublot);
    addField('is_fully_paid', is_fully_paid);
    addField('is_partially_paid', is_partially_paid);
    addField('is_funded', is_funded);
    addField('is_insured', is_insured);
    addField('doc_type', doc_type);
    addField('container_cost', container_cost);
    addField('landing_cost', landing_cost);
    addField('vehicle_price', vehicle_price);
    addField('total_price', total_price);
    addField('payed_amount', payed_amount);
    addField('debt_amount', debt_amount);
    addField('container_number', container_number);
    addField('line', line);
    addField('current_status', current_status);
    addField('vehicle_pickup_date', vehicle_pickup_date);
    addField('warehouse_receive_date', warehouse_receive_date);
    addField('container_loading_date', container_loading_date);
    addField('estimated_receive_date', estimated_receive_date);
    addField('receive_date', receive_date);
    addField('booking', booking);
    addField('dealer_fee', dealer_fee);
    addField('status_color', status_color);
    addField('buyer_number', buyer_number);
    addField('has_key', has_key);
    addField('has_auction_image', has_auction_image);
    addField('has_transportation_image', has_transportation_image);
    addField('has_port_image', has_port_image);
    addField('has_poti_image', has_poti_image);
    addField('is_hybrid', is_hybrid);
    addField('vehicle_type', vehicle_type);
    addField('container_open_date', container_open_date);
    addField('container_receive_date', container_receive_date);
    addField('receiver_changed', receiver_changed);
    addField('receiver_change_date', receiver_change_date);
    addField('driver_fullname', driver_fullname);
    addField('driver_phone', driver_phone);
    addField('driver_car_license_number', driver_car_license_number);
    addField('purchase_date', purchase_date);
    addField('driver_company', driver_company);
    addField('late_car_payment', late_car_payment);

    if (fields.length === 0) {
      return res.status(400).json({ error: 1, success: false, message: 'No fields to update' });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE vehicles SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Vehicle not found' });
    }

    logAudit({ userId: req.session.user.id, entityType: 'vehicle', entityId: parseInt(id), action: 'UPDATE', oldValues: oldRecord.rows[0], newValues: result.rows[0], ipAddress: req.ip });
    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateVehicle error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function deleteVehicle(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM vehicles WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Vehicle not found' });
    }

    const deleted = result.rows[0];
    if (deleted.profile_image_url) {
      const key = extractR2Key(deleted.profile_image_url);
      if (key) {
        deleteFromR2(key).catch(err => console.error('Failed to delete image from R2:', err));
      }
    }

    logAudit({ userId: req.session.user.id, entityType: 'vehicle', entityId: parseInt(id), action: 'DELETE', oldValues: deleted, newValues: null, ipAddress: req.ip });
    res.json({ error: 0, success: true, message: 'Vehicle deleted' });
  } catch (err) {
    console.error('deleteVehicle error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function bulkDeleteVehicles(req, res) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 1, success: false, message: 'ids must be a non-empty array' });
    }
    if (ids.length > 100) {
      return res.status(400).json({ error: 1, success: false, message: 'Maximum 100 items per request' });
    }

    // Query images first for R2 cleanup
    const imageResult = await pool.query(
      'SELECT id, profile_image_url FROM vehicles WHERE id = ANY($1::int[])',
      [ids]
    );

    const result = await pool.query(
      'DELETE FROM vehicles WHERE id = ANY($1::int[]) RETURNING id',
      [ids]
    );

    // Fire-and-forget R2 cleanup
    for (const row of imageResult.rows) {
      if (row.profile_image_url) {
        const key = extractR2Key(row.profile_image_url);
        if (key) {
          deleteFromR2(key).catch(err => console.error('Failed to delete image from R2:', err));
        }
      }
    }

    res.json({ error: 0, success: true, deletedCount: result.rowCount, deletedIds: result.rows.map(r => r.id) });
  } catch (err) {
    console.error('bulkDeleteVehicles error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function getCities(req, res) {
  try {
    const result = await pool.query(
      'SELECT DISTINCT destination, port FROM calculator ORDER BY destination'
    );
    res.json({ error: 0, success: true, data: result.rows });
  } catch (err) {
    console.error('getCities error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function getVehicleById(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT v.*, u.name AS dealer_name, u.surname AS dealer_surname, u.email AS dealer_email, u.phone AS dealer_phone
       FROM vehicles v
       LEFT JOIN users u ON v.dealer_id = u.id
       WHERE v.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Vehicle not found' });
    }

    const vehicle = result.rows[0];

    // Non-admin users can only view their own vehicles
    if (req.session.user.role !== 'admin' && vehicle.dealer_id !== req.session.user.id) {
      return res.status(403).json({ error: 1, success: false, message: 'Forbidden' });
    }

    res.json({ error: 0, success: true, data: vehicle });
  } catch (err) {
    console.error('getVehicleById error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function searchVehicles(req, res) {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json({ error: 0, success: true, data: [] });
    }

    const conditions = [
      `(v.vin ILIKE $1 OR v.lot_number ILIKE $1 OR v.mark ILIKE $1 OR v.model ILIKE $1 OR v.buyer ILIKE $1)`
    ];
    const params = [`%${q}%`];
    let paramIndex = 2;

    // Non-admin users only see their own vehicles
    if (req.session.user.role !== 'admin') {
      conditions.push(`v.dealer_id = $${paramIndex}`);
      params.push(req.session.user.id);
      paramIndex++;
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ');

    const result = await pool.query(
      `SELECT v.id, v.vin, v.mark, v.model, v.year, v.profile_image_url, v.buyer, v.current_status
       FROM vehicles v
       ${whereClause}
       ORDER BY v.id DESC
       LIMIT 10`,
      params
    );

    res.json({ error: 0, success: true, data: result.rows });
  } catch (err) {
    console.error('searchVehicles error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

module.exports = { getVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle, bulkDeleteVehicles, getCities, searchVehicles };
