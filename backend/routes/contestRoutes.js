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
    deleteContest,
    exitContest,
    submitContest,
    rejoinContest,
    heartbeatContest,
    getMyContestSummary,
    getMyContestHistory,
    getFriendsContestResults,
    finalizeContestResults,
    recalculateContestResults,
    getContestAnalytics
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
router.get('/history/me', protect, getMyContestHistory);
router.get('/:id/participants', contestIdValidation, validateRequest, getContestParticipants);
router.get('/:id/leaderboard', contestIdValidation, validateRequest, getLeaderboard);
router.get('/:id/friends-leaderboard', protect, contestIdValidation, validateRequest, getFriendsContestResults);
router.get('/:id/my-summary', protect, contestIdValidation, validateRequest, getMyContestSummary);
router.get('/:id/analytics', protect, authorize('ADMIN', 'SUPER_ADMIN'), contestIdValidation, validateRequest, getContestAnalytics);
router.post('/:id/register', protect, contestIdValidation, validateRequest, registerForContest);
router.post('/:id/exit', protect, contestIdValidation, validateRequest, exitContest);
router.post('/:id/submit', protect, contestIdValidation, validateRequest, submitContest);
router.post('/:id/rejoin', protect, contestIdValidation, validateRequest, rejoinContest);
router.post('/:id/heartbeat', protect, contestIdValidation, validateRequest, heartbeatContest);
router.post('/:id/finalize', protect, authorize('ADMIN', 'SUPER_ADMIN'), contestIdValidation, validateRequest, finalizeContestResults);
router.post('/:id/recalculate', protect, authorize('SUPER_ADMIN'), contestIdValidation, validateRequest, recalculateContestResults);
router.put('/:id/approve', protect, authorize('SUPER_ADMIN'), contestIdValidation, validateRequest, approveContest);
router.delete('/:id', protect, authorize('SUPER_ADMIN'), contestIdValidation, validateRequest, deleteContest);
router.get('/:id', optionalProtect, contestIdValidation, validateRequest, getContest);

module.exports = router;
