const express = require('express');
const router = express.Router();
const vehiclesController = require('../controllers/vehiclesController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', requireAuth, vehiclesController.getVehicles);
router.post('/bulk-delete', requireAdmin, vehiclesController.bulkDeleteVehicles);
router.get('/:id', requireAuth, vehiclesController.getVehicleById);
router.post('/', requireAdmin, upload.single('profile_image'), vehiclesController.createVehicle);
router.put('/:id', requireAdmin, upload.single('profile_image'), vehiclesController.updateVehicle);
router.delete('/:id', requireAdmin, vehiclesController.deleteVehicle);

module.exports = router;
