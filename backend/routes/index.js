const express = require('express');
const router = express.Router();

// Import route modules (placeholders created by scaffold)
const authRoutes = require('./authRoutes');
const algorithmRoutes = require('./algorithmRoutes');
const problemRoutes = require('./problemRoutes');
const submissionRoutes = require('./submissionRoutes');
const companyRoutes = require('./companyRoutes');
const doubtRoutes = require('./doubtRoutes');
const settingRoutes = require('./settingRoutes');
const profileRoutes = require('./profileRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/algorithms', algorithmRoutes);
router.use('/problems', problemRoutes);
router.use('/submissions', submissionRoutes);
router.use('/companies', companyRoutes);
router.use('/users', require('./userRoutes'));
router.use('/profiles', profileRoutes);
router.use('/doubts', doubtRoutes);
router.use('/settings', settingRoutes);

// Test route
router.get('/', (req, res) => {
    res.json({ message: 'API is working properly' });
});

module.exports = router;
