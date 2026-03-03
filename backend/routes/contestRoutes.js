const express = require('express');
const router = express.Router();

const { protect, optionalProtect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { contestIdValidation, createContestValidation } = require('../middleware/contestValidation');
const {
    createContest,
    getAllContests,
    getContest,
    registerForContest,
    getContestParticipants,
    getLeaderboard,
    getPendingContests,
    approveContest,
    deleteContest
} = require('../controllers/contestController');

router.post(
    '/',
    protect,
    authorize('ADMIN', 'SUPER_ADMIN'),
    createContestValidation,
    validateRequest,
    createContest
);

// Must come BEFORE /:id to avoid "pending" being parsed as a MongoId
router.get('/pending', protect, authorize('SUPER_ADMIN'), getPendingContests);

router.get('/', optionalProtect, getAllContests);
router.get('/:id/participants', contestIdValidation, validateRequest, getContestParticipants);
router.get('/:id/leaderboard', contestIdValidation, validateRequest, getLeaderboard);
router.post('/:id/register', protect, contestIdValidation, validateRequest, registerForContest);
router.put('/:id/approve', protect, authorize('SUPER_ADMIN'), contestIdValidation, validateRequest, approveContest);
router.delete('/:id', protect, authorize('SUPER_ADMIN'), contestIdValidation, validateRequest, deleteContest);
router.get('/:id', optionalProtect, contestIdValidation, validateRequest, getContest);

module.exports = router;
