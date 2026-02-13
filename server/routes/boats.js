const express = require('express');
const router = express.Router();
const boatsController = require('../controllers/boatsController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, boatsController.getBoats);
router.post('/', requireAdmin, boatsController.createBoat);
router.put('/:id', requireAdmin, boatsController.updateBoat);
router.delete('/:id', requireAdmin, boatsController.deleteBoat);

module.exports = router;
