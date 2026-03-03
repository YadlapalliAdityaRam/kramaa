const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getSetting, updateSetting, getAllSettings } = require('../controllers/settingController');

// Get a specific setting (public)
router.get('/:key', getSetting);

// Get all settings (Super Admin)
router.get('/', protect, authorize('SUPER_ADMIN'), getAllSettings);

// Update a setting (Super Admin only)
router.put('/:key', protect, authorize('SUPER_ADMIN'), updateSetting);

module.exports = router;
