const express = require('express');
const router = express.Router();
const ticketsController = require('../controllers/ticketsController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, ticketsController.getTickets);
router.get('/:id', requireAuth, ticketsController.getTicketById);
router.post('/', requireAuth, ticketsController.createTicket);
router.put('/:id', requireAuth, ticketsController.updateTicket);
router.delete('/:id', requireAdmin, ticketsController.deleteTicket);

module.exports = router;
