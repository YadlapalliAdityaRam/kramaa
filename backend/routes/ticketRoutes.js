const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    createTicket,
    getTickets,
    getTicketDetails,
    sendMessage,
    makeDecision
} = require('../controllers/ticketController');

// All ticket routes require authentication
router.use(protect);

// Routes
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), createTicket);
router.get('/', authorize('ADMIN', 'SUPER_ADMIN'), getTickets);
router.get('/:id', authorize('ADMIN', 'SUPER_ADMIN'), getTicketDetails);

// Chat
router.post('/:id/message', authorize('ADMIN', 'SUPER_ADMIN'), sendMessage);

// Decision (Super Admin Only)
router.post('/:id/decision', authorize('SUPER_ADMIN'), makeDecision);

module.exports = router;
