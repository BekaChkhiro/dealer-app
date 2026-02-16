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
          (SELECT COUNT(*) FROM containers)::int AS total_containers,
          (SELECT COUNT(*) FROM boats)::int AS total_boats,
          (SELECT COUNT(*) FROM boats WHERE status = 'in_transit')::int AS boats_in_transit
      `;
      countsParams = [];
    } else {
      countsQuery = `
        SELECT
          (SELECT COUNT(*) FROM vehicles WHERE dealer_id = $1)::int AS total_vehicles,
          (SELECT COUNT(*) FROM booking WHERE user_id = $1)::int AS total_bookings,
          (SELECT COUNT(*) FROM containers WHERE user_id = $1)::int AS total_containers,
          (SELECT COUNT(*) FROM boats)::int AS total_boats,
          (SELECT COUNT(*) FROM boats WHERE status = 'in_transit')::int AS boats_in_transit
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
        total_boats: countsRow.total_boats,
        boats_in_transit: countsRow.boats_in_transit,
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

module.exports = { getStats };
