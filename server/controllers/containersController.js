const pool = require('../config/db');
const { logAudit } = require('../helpers/auditLog');

const ALLOWED_SORT_COLUMNS = ['id', 'container_number', 'vin', 'purchase_date', 'manufacturer', 'model', 'manufacturer_year', 'buyer_name', 'booking', 'delivery_location', 'container_open_date', 'line', 'personal_number', 'lot_number', 'loading_port', 'container_loaded_date', 'container_receive_date', 'status', 'port_id'];
const ALLOWED_ORDER = ['asc', 'desc'];

async function getContainers(req, res) {
  try {
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * limit;
    const keyword = req.query.keyword || '';
    const sortBy = ALLOWED_SORT_COLUMNS.includes(req.query.sort_by) ? req.query.sort_by : 'id';
    const order = ALLOWED_ORDER.includes(req.query.asc) ? req.query.asc : 'desc';
    const { start_date, end_date, status } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (keyword) {
      conditions.push(`(c.vin ILIKE $${paramIndex} OR c.container_number ILIKE $${paramIndex} OR c.buyer_name ILIKE $${paramIndex} OR c.booking ILIKE $${paramIndex})`);
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (start_date) {
      conditions.push(`c.purchase_date >= $${paramIndex}`);
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      conditions.push(`c.purchase_date <= $${paramIndex}`);
      params.push(end_date);
      paramIndex++;
    }

    if (status) {
      conditions.push(`c.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (req.query.port_id) {
      conditions.push(`c.port_id = $${paramIndex}`);
      params.push(req.query.port_id);
      paramIndex++;
    }

    // Non-admin users only see their own containers
    if (req.session.user.role !== 'admin') {
      conditions.push(`c.user_id = $${paramIndex}`);
      params.push(req.session.user.id);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM containers c ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT c.* FROM containers c ${whereClause} ORDER BY c.${sortBy} ${order} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({ error: 0, success: true, data: dataResult.rows, total });
  } catch (err) {
    console.error('getContainers error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function createContainer(req, res) {
  try {
    const {
      container_number, vin, purchase_date, manufacturer, model,
      manufacturer_year, buyer_name, booking, delivery_location,
      container_open_date, line, personal_number, lot_number,
      loading_port, container_loaded_date, container_receive_date,
      user_id, status, port_id, loaded_date, estimated_arrival, received_date, opened_date
    } = req.body;

    const result = await pool.query(
      `INSERT INTO containers (
        container_number, vin, purchase_date, manufacturer, model,
        manufacturer_year, buyer_name, booking, delivery_location,
        container_open_date, line, personal_number, lot_number,
        loading_port, container_loaded_date, container_receive_date,
        user_id, status, port_id, loaded_date, estimated_arrival, received_date, opened_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING *`,
      [
        container_number || null, vin || null, purchase_date || null,
        manufacturer || null, model || null, manufacturer_year || null,
        buyer_name || null, booking || null, delivery_location || null,
        container_open_date || null, line || null, personal_number || null,
        lot_number || null, loading_port || null, container_loaded_date || null,
        container_receive_date || null,
        user_id || null, status || 'booked', port_id || null,
        loaded_date || null, estimated_arrival || null, received_date || null, opened_date || null
      ]
    );

    logAudit({ userId: req.session.user.id, entityType: 'container', entityId: result.rows[0].id, action: 'CREATE', oldValues: null, newValues: result.rows[0], ipAddress: req.ip });
    res.status(201).json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createContainer error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

// Map container status to vehicle status
const CONTAINER_TO_VEHICLE_STATUS = {
  'pending': 'pending',
  'booked': 'booked',
  'loaded': 'loaded',
  'in_transit': 'in_transit',
  'arrived': 'arrived',
  'delivered': 'delivered'
};

/**
 * Update all vehicles in a container when container status changes.
 * Logs each vehicle status change to the audit log.
 */
async function updateVehiclesForContainerStatus(containerNumber, oldStatus, newStatus, userId, ipAddress) {
  if (!containerNumber || oldStatus === newStatus) return { updated: 0, vehicles: [] };

  const vehicleStatus = CONTAINER_TO_VEHICLE_STATUS[newStatus] || newStatus;

  // Find all vehicles with this container number
  const vehiclesResult = await pool.query(
    'SELECT id, current_status FROM vehicles WHERE container_number = $1',
    [containerNumber]
  );

  if (vehiclesResult.rows.length === 0) return { updated: 0, vehicles: [] };

  const updatedVehicles = [];

  for (const vehicle of vehiclesResult.rows) {
    const oldVehicleStatus = vehicle.current_status;

    // Update the vehicle status
    const updateResult = await pool.query(
      'UPDATE vehicles SET current_status = $1 WHERE id = $2 RETURNING *',
      [vehicleStatus, vehicle.id]
    );

    if (updateResult.rows.length > 0) {
      updatedVehicles.push(updateResult.rows[0]);

      // Log the audit for each vehicle
      logAudit({
        userId,
        entityType: 'vehicle',
        entityId: vehicle.id,
        action: 'UPDATE',
        oldValues: { current_status: oldVehicleStatus },
        newValues: { current_status: vehicleStatus, updated_by_container: containerNumber },
        ipAddress
      });
    }
  }

  return { updated: updatedVehicles.length, vehicles: updatedVehicles };
}

async function updateContainer(req, res) {
  try {
    const { id } = req.params;
    const oldRecord = await pool.query('SELECT * FROM containers WHERE id = $1', [id]);

    if (oldRecord.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Container not found' });
    }

    const {
      container_number, vin, purchase_date, manufacturer, model,
      manufacturer_year, buyer_name, booking, delivery_location,
      container_open_date, line, personal_number, lot_number,
      loading_port, container_loaded_date, container_receive_date,
      user_id, status, port_id, loaded_date, estimated_arrival, received_date, opened_date
    } = req.body;

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

    addField('container_number', container_number);
    addField('vin', vin);
    addField('purchase_date', purchase_date);
    addField('manufacturer', manufacturer);
    addField('model', model);
    addField('manufacturer_year', manufacturer_year);
    addField('buyer_name', buyer_name);
    addField('booking', booking);
    addField('delivery_location', delivery_location);
    addField('container_open_date', container_open_date);
    addField('line', line);
    addField('personal_number', personal_number);
    addField('lot_number', lot_number);
    addField('loading_port', loading_port);
    addField('container_loaded_date', container_loaded_date);
    addField('container_receive_date', container_receive_date);
    addField('user_id', user_id);
    addField('status', status);
    addField('port_id', port_id);
    addField('loaded_date', loaded_date);
    addField('estimated_arrival', estimated_arrival);
    addField('received_date', received_date);
    addField('opened_date', opened_date);

    if (fields.length === 0) {
      return res.status(400).json({ error: 1, success: false, message: 'No fields to update' });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE containers SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Container not found' });
    }

    const updatedContainer = result.rows[0];
    const oldContainer = oldRecord.rows[0];

    // Log container update audit
    logAudit({ userId: req.session.user.id, entityType: 'container', entityId: parseInt(id), action: 'UPDATE', oldValues: oldContainer, newValues: updatedContainer, ipAddress: req.ip });

    // Auto-update vehicle statuses when container status changes
    let vehicleUpdateResult = { updated: 0, vehicles: [] };
    if (status !== undefined && status !== oldContainer.status) {
      const containerNum = updatedContainer.container_number || oldContainer.container_number;
      vehicleUpdateResult = await updateVehiclesForContainerStatus(
        containerNum,
        oldContainer.status,
        status,
        req.session.user.id,
        req.ip
      );
    }

    res.json({
      error: 0,
      success: true,
      data: updatedContainer,
      vehiclesUpdated: vehicleUpdateResult.updated,
      updatedVehicleIds: vehicleUpdateResult.vehicles.map(v => v.id)
    });
  } catch (err) {
    console.error('updateContainer error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function deleteContainer(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM containers WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Container not found' });
    }

    logAudit({ userId: req.session.user.id, entityType: 'container', entityId: parseInt(id), action: 'DELETE', oldValues: result.rows[0], newValues: null, ipAddress: req.ip });
    res.json({ error: 0, success: true, message: 'Container deleted' });
  } catch (err) {
    console.error('deleteContainer error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function bulkDeleteContainers(req, res) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 1, success: false, message: 'ids must be a non-empty array' });
    }
    if (ids.length > 100) {
      return res.status(400).json({ error: 1, success: false, message: 'Maximum 100 items per request' });
    }

    const result = await pool.query(
      'DELETE FROM containers WHERE id = ANY($1::int[]) RETURNING id',
      [ids]
    );

    res.json({ error: 0, success: true, deletedCount: result.rowCount, deletedIds: result.rows.map(r => r.id) });
  } catch (err) {
    console.error('bulkDeleteContainers error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function getContainerById(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT c.* FROM containers c WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Container not found' });
    }

    const container = result.rows[0];

    // Non-admin users can only view their own containers
    if (req.session.user.role !== 'admin' && container.user_id !== req.session.user.id) {
      return res.status(403).json({ error: 1, success: false, message: 'Forbidden' });
    }

    res.json({ error: 0, success: true, data: container });
  } catch (err) {
    console.error('getContainerById error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

/**
 * Get vehicles assigned to a specific container
 */
async function getVehiclesByContainer(req, res) {
  try {
    const { id } = req.params;
    const isAdmin = req.session.user?.role === 'admin';
    const userId = req.session.user?.id;

    // Get container info first
    const containerResult = await pool.query(
      'SELECT id, container_number FROM containers WHERE id = $1',
      [id]
    );

    if (containerResult.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Container not found' });
    }

    const container = containerResult.rows[0];

    // Get vehicles by container_id
    // For dealers, only show their own vehicles
    let vehiclesResult;
    if (!isAdmin && userId) {
      vehiclesResult = await pool.query(
        `SELECT v.id, v.vin, v.mark, v.model, v.year, v.lot_number, v.current_status,
                v.profile_image_url, v.dealer_id, v.receiver_fullname, v.fuel_type,
                u.name AS dealer_name, u.surname AS dealer_surname
         FROM vehicles v
         LEFT JOIN users u ON v.dealer_id = u.id
         WHERE v.container_id = $1 AND v.dealer_id = $2
         ORDER BY v.id DESC`,
        [id, userId]
      );
    } else {
      vehiclesResult = await pool.query(
        `SELECT v.id, v.vin, v.mark, v.model, v.year, v.lot_number, v.current_status,
                v.profile_image_url, v.dealer_id, v.receiver_fullname, v.fuel_type,
                u.name AS dealer_name, u.surname AS dealer_surname
         FROM vehicles v
         LEFT JOIN users u ON v.dealer_id = u.id
         WHERE v.container_id = $1
         ORDER BY v.id DESC`,
        [id]
      );
    }

    res.json({
      error: 0,
      success: true,
      data: vehiclesResult.rows,
      container: container,
      total: vehiclesResult.rows.length
    });
  } catch (err) {
    console.error('getVehiclesByContainer error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

/**
 * Get available vehicles (not assigned to any container) for assignment
 */
async function getAvailableVehicles(req, res) {
  try {
    const keyword = req.query.keyword || '';
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

    let query = `
      SELECT v.id, v.vin, v.mark, v.model, v.year, v.lot_number, v.current_status,
             v.profile_image_url, v.dealer_id, v.receiver_fullname,
             u.name AS dealer_name, u.surname AS dealer_surname
      FROM vehicles v
      LEFT JOIN users u ON v.dealer_id = u.id
      WHERE (v.container_number IS NULL OR v.container_number = '')
    `;

    const params = [];
    let paramIndex = 1;

    if (keyword) {
      query += ` AND (v.vin ILIKE $${paramIndex} OR v.lot_number ILIKE $${paramIndex} OR v.mark ILIKE $${paramIndex} OR v.model ILIKE $${paramIndex})`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    query += ` ORDER BY v.id DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.json({
      error: 0,
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    console.error('getAvailableVehicles error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

/**
 * Assign vehicles to a container
 */
async function assignVehiclesToContainer(req, res) {
  try {
    const { id } = req.params;
    const { vehicleIds } = req.body;

    if (!Array.isArray(vehicleIds) || vehicleIds.length === 0) {
      return res.status(400).json({ error: 1, success: false, message: 'vehicleIds must be a non-empty array' });
    }

    if (vehicleIds.length > 50) {
      return res.status(400).json({ error: 1, success: false, message: 'Maximum 50 vehicles per request' });
    }

    // Get container info
    const containerResult = await pool.query(
      'SELECT id, container_number, status FROM containers WHERE id = $1',
      [id]
    );

    if (containerResult.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Container not found' });
    }

    const container = containerResult.rows[0];

    if (!container.container_number) {
      return res.status(400).json({ error: 1, success: false, message: 'Container does not have a container number' });
    }

    // Map container status to vehicle status
    const vehicleStatus = CONTAINER_TO_VEHICLE_STATUS[container.status] || container.status;

    // Update vehicles with the container number and sync status
    const updateResult = await pool.query(
      `UPDATE vehicles
       SET container_number = $1, current_status = $2
       WHERE id = ANY($3::int[])
       RETURNING id, vin`,
      [container.container_number, vehicleStatus, vehicleIds]
    );

    // Log audit for each vehicle
    for (const vehicle of updateResult.rows) {
      logAudit({
        userId: req.session.user.id,
        entityType: 'vehicle',
        entityId: vehicle.id,
        action: 'UPDATE',
        oldValues: { container_number: null },
        newValues: { container_number: container.container_number, assigned_to_container_id: id },
        ipAddress: req.ip
      });
    }

    res.json({
      error: 0,
      success: true,
      message: `${updateResult.rowCount} vehicle(s) assigned to container`,
      assignedCount: updateResult.rowCount,
      assignedVehicles: updateResult.rows
    });
  } catch (err) {
    console.error('assignVehiclesToContainer error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

/**
 * Remove a vehicle from a container
 */
async function removeVehicleFromContainer(req, res) {
  try {
    const { id, vehicleId } = req.params;

    // Get container info
    const containerResult = await pool.query(
      'SELECT id, container_number FROM containers WHERE id = $1',
      [id]
    );

    if (containerResult.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Container not found' });
    }

    const container = containerResult.rows[0];

    // Get vehicle current state
    const vehicleResult = await pool.query(
      'SELECT id, vin, container_number FROM vehicles WHERE id = $1',
      [vehicleId]
    );

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Vehicle not found' });
    }

    const vehicle = vehicleResult.rows[0];

    // Verify vehicle is actually in this container
    if (vehicle.container_number !== container.container_number) {
      return res.status(400).json({ error: 1, success: false, message: 'Vehicle is not in this container' });
    }

    // Remove vehicle from container
    const updateResult = await pool.query(
      `UPDATE vehicles
       SET container_number = NULL, current_status = 'pending'
       WHERE id = $1
       RETURNING id, vin`,
      [vehicleId]
    );

    // Log audit
    logAudit({
      userId: req.session.user.id,
      entityType: 'vehicle',
      entityId: parseInt(vehicleId),
      action: 'UPDATE',
      oldValues: { container_number: container.container_number },
      newValues: { container_number: null, removed_from_container_id: id },
      ipAddress: req.ip
    });

    res.json({
      error: 0,
      success: true,
      message: 'Vehicle removed from container',
      vehicle: updateResult.rows[0]
    });
  } catch (err) {
    console.error('removeVehicleFromContainer error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

module.exports = {
  getContainers,
  getContainerById,
  createContainer,
  updateContainer,
  deleteContainer,
  bulkDeleteContainers,
  updateVehiclesForContainerStatus,
  getVehiclesByContainer,
  getAvailableVehicles,
  assignVehiclesToContainer,
  removeVehicleFromContainer
};
