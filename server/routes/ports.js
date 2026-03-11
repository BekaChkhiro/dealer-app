const express = require('express');
const router = express.Router();
const portsController = require('../controllers/portsController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, portsController.getPorts);
router.get('/:id', requireAuth, portsController.getPortById);
router.get('/:id/containers', requireAuth, portsController.getContainersByPort);
router.post('/', requireAdmin, portsController.createPort);
router.put('/:id', requireAdmin, portsController.updatePort);
router.delete('/:id', requireAdmin, portsController.deletePort);

module.exports = router;
