const express = require('express');
const router = express.Router();
const vehiclesController = require('../controllers/vehiclesController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const uploadDocument = require('../middleware/uploadDocument');

router.get('/', requireAuth, vehiclesController.getVehicles);
router.post('/bulk-delete', requireAdmin, vehiclesController.bulkDeleteVehicles);
router.get('/:id', requireAuth, vehiclesController.getVehicleById);
router.post('/', requireAdmin, upload.single('profile_image'), vehiclesController.createVehicle);
router.put('/:id', requireAdmin, upload.single('profile_image'), vehiclesController.updateVehicle);
router.delete('/:id', requireAdmin, vehiclesController.deleteVehicle);

// Receiver ID document upload
router.post('/:id/upload-receiver-id', requireAuth, uploadDocument.single('receiver_id_document'), vehiclesController.uploadReceiverIdDocument);

module.exports = router;
