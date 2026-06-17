const pool = require('../config/db');
const { logAudit } = require('../helpers/auditLog');

const ALLOWED_SORT_COLUMNS = ['id', 'payer', 'create_date', 'vin', 'mark', 'model', 'year', 'personal_number', 'paid_amount', 'payment_type'];
const ALLOWED_ORDER = ['asc', 'desc'];

async function getTransactions(req, res) {
  try {
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * limit;
    const keyword = req.query.keyword || '';
    const sortBy = ALLOWED_SORT_COLUMNS.includes(req.query.sort_by) ? req.query.sort_by : 'id';
    const order = ALLOWED_ORDER.includes(req.query.asc) ? req.query.asc : 'desc';
    const { start_date, end_date, payer } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (keyword) {
      conditions.push(`(vin ILIKE $${paramIndex} OR payer ILIKE $${paramIndex} OR mark ILIKE $${paramIndex} OR model ILIKE $${paramIndex} OR personal_number ILIKE $${paramIndex})`);
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (start_date) {
      conditions.push(`create_date >= $${paramIndex}`);
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      conditions.push(`create_date <= $${paramIndex}`);
      params.push(end_date);
      paramIndex++;
    }

    if (payer) {
      conditions.push(`payer = $${paramIndex}`);
      params.push(payer);
      paramIndex++;
    }

    // Non-admin users only see transactions for their own vehicles
    if (req.session.user.role !== 'admin') {
      conditions.push(`vin IN (SELECT vin FROM vehicles WHERE dealer_id = $${paramIndex})`);
      params.push(req.session.user.id);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM transactions ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT * FROM transactions ${whereClause} ORDER BY ${sortBy} ${order} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({ error: 0, success: true, data: dataResult.rows, total });
  } catch (err) {
    console.error('getTransactions error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function createTransaction(req, res) {
  const client = await pool.connect();
  try {
    const { payer, vin, mark, model, year, buyer, personal_number, paid_amount, payment_type, addToBalanseAmount } = req.body;

    if (!payment_type) {
      client.release();
      return res.status(400).json({ error: 1, success: false, message: 'Payment type is required' });
    }

    const paidNum = Number(paid_amount);
    if (!Number.isFinite(paidNum) || paidNum < 0) {
      client.release();
      return res.status(400).json({ error: 1, success: false, message: 'paid_amount must be a valid number >= 0' });
    }

    if (payment_type === 'balance') {
      const balanceNum = Number(addToBalanseAmount);
      if (!Number.isFinite(balanceNum) || balanceNum < 0) {
        client.release();
        return res.status(400).json({ error: 1, success: false, message: 'addToBalanseAmount must be a valid number >= 0' });
      }
    }

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO transactions (payer, vin, mark, model, year, buyer, personal_number, paid_amount, payment_type, "addToBalanseAmount")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [payer || null, vin || null, mark || null, model || null, year || null, buyer || null, personal_number || null, paid_amount || 0, payment_type, addToBalanseAmount || 0]
    );

    // Auto-update vehicle debt/paid when paying for a vehicle
    if (['car_amount', 'shipping', 'customs'].includes(payment_type) && vin) {
      await client.query(
        `UPDATE vehicles SET debt_amount = GREATEST(0, COALESCE(debt_amount, 0) - $1),
                             payed_amount = COALESCE(payed_amount, 0) + $1
         WHERE vin = $2`,
        [paidNum, vin]
      );

      // Recalculate user debt as SUM of their vehicles' debt_amount
      if (payer) {
        await client.query(
          `UPDATE users SET debt = COALESCE((
             SELECT SUM(v.debt_amount) FROM vehicles v WHERE v.dealer_id = users.id
           ), 0)
           WHERE username = $1`,
          [payer]
        );
      }
    }

    // Auto-update user balance for balance payments
    if (payment_type === 'balance' && addToBalanseAmount && payer) {
      await client.query(
        `UPDATE users SET balance = COALESCE(balance, 0) + $1 WHERE username = $2`,
        [Number(addToBalanseAmount), payer]
      );
    }

    await client.query('COMMIT');
    logAudit({ userId: req.session.user.id, entityType: 'transaction', entityId: result.rows[0].id, action: 'CREATE', oldValues: null, newValues: result.rows[0], ipAddress: req.ip });
    res.status(201).json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createTransaction error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  } finally {
    client.release();
  }
}

async function updateTransaction(req, res) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const oldRecord = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);

    if (oldRecord.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 1, success: false, message: 'Transaction not found' });
    }

    const { payer, vin, mark, model, year, buyer, personal_number, paid_amount, payment_type, addToBalanseAmount } = req.body;

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

    addField('payer', payer);
    addField('vin', vin);
    addField('mark', mark);
    addField('model', model);
    addField('year', year);
    addField('buyer', buyer);
    addField('personal_number', personal_number);
    addField('paid_amount', paid_amount);
    addField('payment_type', payment_type);

    if (addToBalanseAmount !== undefined) {
      fields.push(`"addToBalanseAmount" = $${paramIndex}`);
      params.push(addToBalanseAmount);
      paramIndex++;
    }

    if (fields.length === 0) {
      client.release();
      return res.status(400).json({ error: 1, success: false, message: 'No fields to update' });
    }

    await client.query('BEGIN');

    // --- Reverse the OLD transaction's side-effects ---
    const old = oldRecord.rows[0];
    const oldPaidNum = Number(old.paid_amount) || 0;
    const oldPaymentType = old.payment_type;
    const oldVin = old.vin;
    const oldPayer = old.payer;
    const oldAddToBalance = Number(old.addToBalanseAmount) || 0;

    if (['car_amount', 'shipping', 'customs'].includes(oldPaymentType) && oldVin) {
      await client.query(
        `UPDATE vehicles SET payed_amount = GREATEST(0, COALESCE(payed_amount, 0) - $1),
                             debt_amount = COALESCE(debt_amount, 0) + $1
         WHERE vin = $2`,
        [oldPaidNum, oldVin]
      );
      if (oldPayer) {
        await client.query(
          `UPDATE users SET debt = COALESCE((
             SELECT SUM(v.debt_amount) FROM vehicles v WHERE v.dealer_id = users.id
           ), 0)
           WHERE username = $1`,
          [oldPayer]
        );
      }
    }

    if (oldPaymentType === 'balance' && oldAddToBalance && oldPayer) {
      await client.query(
        `UPDATE users SET balance = COALESCE(balance, 0) - $1 WHERE username = $2`,
        [oldAddToBalance, oldPayer]
      );
    }

    // --- Apply the UPDATE ---
    params.push(id);
    const result = await client.query(
      `UPDATE transactions SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    // --- Apply the NEW transaction's side-effects ---
    const newRow = result.rows[0];
    const newPaidNum = Number(newRow.paid_amount) || 0;
    const newPaymentType = newRow.payment_type;
    const newVin = newRow.vin;
    const newPayer = newRow.payer;
    const newAddToBalance = Number(newRow.addToBalanseAmount) || 0;

    if (['car_amount', 'shipping', 'customs'].includes(newPaymentType) && newVin) {
      await client.query(
        `UPDATE vehicles SET debt_amount = GREATEST(0, COALESCE(debt_amount, 0) - $1),
                             payed_amount = COALESCE(payed_amount, 0) + $1
         WHERE vin = $2`,
        [newPaidNum, newVin]
      );
      if (newPayer) {
        await client.query(
          `UPDATE users SET debt = COALESCE((
             SELECT SUM(v.debt_amount) FROM vehicles v WHERE v.dealer_id = users.id
           ), 0)
           WHERE username = $1`,
          [newPayer]
        );
      }
    }

    if (newPaymentType === 'balance' && newAddToBalance && newPayer) {
      await client.query(
        `UPDATE users SET balance = COALESCE(balance, 0) + $1 WHERE username = $2`,
        [newAddToBalance, newPayer]
      );
    }

    await client.query('COMMIT');
    logAudit({ userId: req.session.user.id, entityType: 'transaction', entityId: parseInt(id), action: 'UPDATE', oldValues: old, newValues: newRow, ipAddress: req.ip });
    res.json({ error: 0, success: true, data: newRow });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (rbErr) { console.error('updateTransaction rollback error:', rbErr); }
    console.error('updateTransaction error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  } finally {
    client.release();
  }
}

async function deleteTransaction(req, res) {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 1, success: false, message: 'Transaction not found' });
    }

    const old = existing.rows[0];
    const oldPaidNum = Number(old.paid_amount) || 0;
    const oldPaymentType = old.payment_type;
    const oldVin = old.vin;
    const oldPayer = old.payer;
    const oldAddToBalance = Number(old.addToBalanseAmount) || 0;

    await client.query('BEGIN');

    // Reverse vehicle debt/paid effects
    if (['car_amount', 'shipping', 'customs'].includes(oldPaymentType) && oldVin) {
      await client.query(
        `UPDATE vehicles SET payed_amount = GREATEST(0, COALESCE(payed_amount, 0) - $1),
                             debt_amount = COALESCE(debt_amount, 0) + $1
         WHERE vin = $2`,
        [oldPaidNum, oldVin]
      );
      // Recalculate user debt as SUM of their vehicles' debt_amount
      if (oldPayer) {
        await client.query(
          `UPDATE users SET debt = COALESCE((
             SELECT SUM(v.debt_amount) FROM vehicles v WHERE v.dealer_id = users.id
           ), 0)
           WHERE username = $1`,
          [oldPayer]
        );
      }
    }

    // Reverse balance effect
    if (oldPaymentType === 'balance' && oldAddToBalance && oldPayer) {
      await client.query(
        `UPDATE users SET balance = COALESCE(balance, 0) - $1 WHERE username = $2`,
        [oldAddToBalance, oldPayer]
      );
    }

    await client.query('DELETE FROM transactions WHERE id = $1', [id]);
    await client.query('COMMIT');

    logAudit({ userId: req.session.user.id, entityType: 'transaction', entityId: parseInt(id), action: 'DELETE', oldValues: old, newValues: null, ipAddress: req.ip });
    res.json({ error: 0, success: true, message: 'Transaction deleted' });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (rbErr) { console.error('deleteTransaction rollback error:', rbErr); }
    console.error('deleteTransaction error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  } finally {
    client.release();
  }
}

async function getTransactionById(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Transaction not found' });
    }

    const transaction = result.rows[0];

    // Non-admin users can only view transactions for their own vehicles
    if (req.session.user.role !== 'admin' && transaction.vin) {
      const ownership = await pool.query(
        'SELECT id FROM vehicles WHERE vin = $1 AND dealer_id = $2',
        [transaction.vin, req.session.user.id]
      );
      if (ownership.rows.length === 0) {
        return res.status(403).json({ error: 1, success: false, message: 'Forbidden' });
      }
    }

    res.json({ error: 0, success: true, data: transaction });
  } catch (err) {
    console.error('getTransactionById error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

module.exports = { getTransactions, getTransactionById, createTransaction, updateTransaction, deleteTransaction };
