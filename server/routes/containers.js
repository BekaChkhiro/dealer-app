const express = require('express');
const router = express.Router();
const containersController = require('../controllers/containersController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, containersController.getContainers);
router.get('/available-vehicles', requireAuth, containersController.getAvailableVehicles);
router.post('/bulk-delete', requireAdmin, containersController.bulkDeleteContainers);
router.get('/:id', requireAuth, containersController.getContainerById);
router.get('/:id/vehicles', requireAuth, containersController.getVehiclesByContainer);
router.post('/:id/vehicles', requireAdmin, containersController.assignVehiclesToContainer);
router.delete('/:id/vehicles/:vehicleId', requireAdmin, containersController.removeVehicleFromContainer);
router.post('/', requireAdmin, containersController.createContainer);
router.put('/:id', requireAdmin, containersController.updateContainer);
router.delete('/:id', requireAdmin, containersController.deleteContainer);

module.exports = router;
