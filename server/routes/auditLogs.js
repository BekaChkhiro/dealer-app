const express = require('express');
const router = express.Router();
const auditLogsController = require('../controllers/auditLogsController');
const { requireAdmin } = require('../middleware/auth');

router.get('/', requireAdmin, auditLogsController.getAuditLogs);

module.exports = router;
