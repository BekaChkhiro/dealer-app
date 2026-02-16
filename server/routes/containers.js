const express = require('express');
const router = express.Router();
const containersController = require('../controllers/containersController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, containersController.getContainers);
router.post('/bulk-delete', requireAdmin, containersController.bulkDeleteContainers);
router.get('/:id', requireAuth, containersController.getContainerById);
router.post('/', requireAdmin, containersController.createContainer);
router.put('/:id', requireAdmin, containersController.updateContainer);
router.delete('/:id', requireAdmin, containersController.deleteContainer);

module.exports = router;
