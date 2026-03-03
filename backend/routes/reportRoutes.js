const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const {
    createReport,
    getReports,
    updateReportStatus
} = require('../controllers/reportController');

// Rate limiting to prevent report abuse (5 reports per 10 mins)
const reportLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many reports created from this IP, please try again after 10 minutes.' }
});

// Protect all routes
router.use(protect);

// User Route
router.post('/', reportLimiter, createReport);

// Admin Routes
router.get('/admin', authorize('ADMIN', 'SUPER_ADMIN'), getReports);
router.put('/admin/:id', authorize('ADMIN', 'SUPER_ADMIN'), updateReportStatus);

module.exports = router;
