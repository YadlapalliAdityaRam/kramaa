const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const controller = require('../controllers/mentorController');
router.get('/concepts', controller.getConcepts);
router.get('/concepts/:slug', controller.getConcept);
router.post('/respond', protect, controller.respond);
module.exports = router;
