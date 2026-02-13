const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, bookingController.getBookings);
router.post('/', requireAdmin, bookingController.createBooking);
router.put('/:id', requireAdmin, bookingController.updateBooking);
router.delete('/:id', requireAdmin, bookingController.deleteBooking);

module.exports = router;
