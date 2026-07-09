const pool = require('../config/db');

const getStats = async (req, res) => {
  try {
    const user = req.session.user;
    const isAdmin = user.role === 'admin';
    const userId = user.id;

    let countsQuery;
    let countsParams;

    if (isAdmin) {
      countsQuery = `
        SELECT
          (SELECT COUNT(*) FROM vehicles)::int AS total_vehicles,
          (SELECT COUNT(*) FROM booking)::int AS total_bookings,
          (SELECT COUNT(*) FROM containers)::int AS total_containers
      `;
      countsParams = [];
    } else {
      countsQuery = `
        SELECT
          (SELECT COUNT(*) FROM vehicles WHERE dealer_id = $1)::int AS total_vehicles,
          (SELECT COUNT(*) FROM booking WHERE user_id = $1)::int AS total_bookings,
          (SELECT COUNT(*) FROM containers WHERE user_id = $1)::int AS total_containers
      `;
      countsParams = [userId];
    }

    let financialQuery;
    let financialParams;

    if (isAdmin) {
      financialQuery = `
        SELECT
          COALESCE(SUM(balance), 0)::numeric AS total_balance,
          COALESCE(SUM(debt), 0)::numeric AS total_debt
        FROM users
      `;
      financialParams = [];
    } else {
      financialQuery = `
        SELECT
          COALESCE(balance, 0)::numeric AS total_balance,
          COALESCE(debt, 0)::numeric AS total_debt
        FROM users WHERE id = $1
      `;
      financialParams = [userId];
    }

    let vehiclesByStatusQuery;
    let vehiclesByStatusParams;

    if (isAdmin) {
      vehiclesByStatusQuery = `
        SELECT current_status, COUNT(*)::int AS count
        FROM vehicles
        GROUP BY current_status
        ORDER BY count DESC
      `;
      vehiclesByStatusParams = [];
    } else {
      vehiclesByStatusQuery = `
        SELECT current_status, COUNT(*)::int AS count
        FROM vehicles
        WHERE dealer_id = $1
        GROUP BY current_status
        ORDER BY count DESC
      `;
      vehiclesByStatusParams = [userId];
    }

    let recentTransactionsQuery;
    let recentTransactionsParams;

    if (isAdmin) {
      recentTransactionsQuery = `
        SELECT id, payer, vin, mark, model, year, personal_number,
               paid_amount, payment_type, create_date
        FROM transactions
        ORDER BY create_date DESC
        LIMIT 5
      `;
      recentTransactionsParams = [];
    } else {
      recentTransactionsQuery = `
        SELECT t.id, t.payer, t.vin, t.mark, t.model, t.year, t.personal_number,
               t.paid_amount, t.payment_type, t.create_date
        FROM transactions t
        WHERE t.vin IN (SELECT vin FROM vehicles WHERE dealer_id = $1)
        ORDER BY t.create_date DESC
        LIMIT 5
      `;
      recentTransactionsParams = [userId];
    }

    const [counts, financial, vehiclesByStatus, recentTransactions] = await Promise.all([
      pool.query(countsQuery, countsParams),
      pool.query(financialQuery, financialParams),
      pool.query(vehiclesByStatusQuery, vehiclesByStatusParams),
      pool.query(recentTransactionsQuery, recentTransactionsParams),
    ]);

    const countsRow = counts.rows[0];
    const financialRow = financial.rows[0] || { total_balance: 0, total_debt: 0 };

    const statusMap = {};
    for (const row of vehiclesByStatus.rows) {
      statusMap[row.current_status || 'unknown'] = row.count;
    }

    res.json({
      error: 0,
      success: true,
      data: {
        total_vehicles: countsRow.total_vehicles,
        total_bookings: countsRow.total_bookings,
        total_containers: countsRow.total_containers,
        total_balance: Number(financialRow.total_balance),
        total_debt: Number(financialRow.total_debt),
        vehicles_by_status: statusMap,
        recent_transactions: recentTransactions.rows,
      },
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Failed to load dashboard stats' });
  }
};

const STATUS_KEYS = ['purchased', 'at_warehouse', 'to_load', 'loaded', 'in_transit', 'arrived', 'delivered'];

function statusCountsSelect(alias) {
  return STATUS_KEYS.map(
    (s) => `COUNT(*) FILTER (WHERE ${alias}.current_status = '${s}')::int AS ${s}`
  ).join(',\n          ');
}

function emptyByStatus() {
  const obj = {};
  for (const s of STATUS_KEYS) obj[s] = 0;
  return obj;
}

function groupsFromByStatus(byStatus) {
  return {
    received: byStatus.purchased + byStatus.at_warehouse,
    to_load: byStatus.to_load,
    in_transit: byStatus.loaded + byStatus.in_transit,
    arrived: byStatus.arrived,
    delivered: byStatus.delivered,
  };
}

const getAnalytics = async (req, res) => {
  try {
    const user = req.session.user;
    const isAdmin = user.role === 'admin';
    const userId = user.id;

    const dealerFilter = isAdmin ? '' : 'WHERE v.dealer_id = $1';
    const dealerParams = isAdmin ? [] : [userId];

    const overallQuery = `
      SELECT
        COUNT(*)::int AS total,
        ${statusCountsSelect('v')}
      FROM vehicles v
      ${dealerFilter}
    `;

    const byWarehouseQuery = `
      SELECT
        v.warehouse_id,
        w.name AS warehouse_name,
        COUNT(*)::int AS total,
        ${statusCountsSelect('v')}
      FROM vehicles v
      LEFT JOIN warehouses w ON v.warehouse_id = w.id
      ${dealerFilter}
      GROUP BY v.warehouse_id, w.name
      ORDER BY w.name NULLS LAST
    `;

    const byPortQuery = `
      SELECT
        COALESCE(p.name, 'Unassigned') AS port_name,
        COUNT(*)::int AS total,
        ${statusCountsSelect('v')}
      FROM vehicles v
      LEFT JOIN ports p ON v.destination_port_id = p.id
      ${dealerFilter}
      GROUP BY COALESCE(p.name, 'Unassigned')
      ORDER BY port_name
    `;

    const [overall, byWarehouse, byPort] = await Promise.all([
      pool.query(overallQuery, dealerParams),
      pool.query(byWarehouseQuery, dealerParams),
      pool.query(byPortQuery, dealerParams),
    ]);

    const overallRow = overall.rows[0] || { total: 0 };
    const byStatus = emptyByStatus();
    for (const s of STATUS_KEYS) {
      byStatus[s] = overallRow[s] || 0;
    }

    const byWarehouseData = byWarehouse.rows.map((row) => {
      const rowByStatus = {};
      for (const s of STATUS_KEYS) rowByStatus[s] = row[s] || 0;
      return {
        warehouse_id: row.warehouse_id,
        warehouse_name: row.warehouse_name,
        total: row.total,
        ...rowByStatus,
      };
    });

    const byPortData = byPort.rows.map((row) => {
      const rowByStatus = {};
      for (const s of STATUS_KEYS) rowByStatus[s] = row[s] || 0;
      const groups = groupsFromByStatus(rowByStatus);
      return {
        port_name: row.port_name,
        total: row.total,
        received: groups.received,
        to_load: groups.to_load,
        in_transit: groups.in_transit,
        arrived: groups.arrived,
        delivered: groups.delivered,
      };
    });

    res.json({
      error: 0,
      success: true,
      data: {
        total: overallRow.total,
        by_status: byStatus,
        groups: groupsFromByStatus(byStatus),
        by_warehouse: byWarehouseData,
        by_port: byPortData,
      },
    });
  } catch (err) {
    console.error('Dashboard analytics error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Failed to load dashboard analytics' });
  }
};

module.exports = { getStats, getAnalytics };
