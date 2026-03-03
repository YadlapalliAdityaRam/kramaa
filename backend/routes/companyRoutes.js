const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/companies
// @desc    Get all companies (public)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const companies = await Company.find().sort({ order: 1, createdAt: -1 });
        res.json({ success: true, companies });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/companies
// @desc    Create a new company
// @access  Admin only
router.post('/', protect, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const company = await Company.create(req.body);
        res.status(201).json({ success: true, company });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/companies/:id
// @desc    Update a company
// @access  Admin only
router.put('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const company = await Company.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        res.json({ success: true, company });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// @route   DELETE /api/companies/:id
// @desc    Delete a company
// @access  Admin only
router.delete('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const company = await Company.findByIdAndDelete(req.params.id);

        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        res.json({ success: true, message: 'Company deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
