const pool = require('../config/db');

/**
 * Log an audit event. Fire-and-forget — never throws, never blocks the caller.
 *
 * @param {Object} opts
 * @param {number}  opts.userId        - ID of the user performing the action
 * @param {string}  opts.entityType    - e.g. 'vehicle', 'user', 'booking'
 * @param {number}  opts.entityId      - PK of the affected row
 * @param {string}  opts.action        - 'CREATE', 'UPDATE', or 'DELETE'
 * @param {Object}  [opts.oldValues]   - Row state before mutation (null for CREATE)
 * @param {Object}  [opts.newValues]   - Row state after mutation (null for DELETE)
 * @param {string}  [opts.ipAddress]   - Request IP
 * @param {string[]} [opts.sensitiveFields] - Keys to strip from old/new values
 */
function logAudit({ userId, entityType, entityId, action, oldValues, newValues, ipAddress, sensitiveFields }) {
  try {
    const strip = (obj) => {
      if (!obj || !sensitiveFields || sensitiveFields.length === 0) return obj;
      const copy = { ...obj };
      for (const key of sensitiveFields) {
        if (key in copy) copy[key] = '[REDACTED]';
      }
      return copy;
    };

    const cleanOld = strip(oldValues) || null;
    const cleanNew = strip(newValues) || null;

    pool.query(
      `INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_values, new_values, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, entityType, entityId, action, JSON.stringify(cleanOld), JSON.stringify(cleanNew), ipAddress || null]
    ).catch(err => console.error('Audit log write failed:', err));
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

module.exports = { logAudit };
