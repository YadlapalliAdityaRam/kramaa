const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const upload = require('../middleware/upload');
const { protect, optionalProtect, authorize } = require('../middleware/auth');
const {
    getDoubts,
    getReplies,
    createDoubt,
    editDoubt,
    deleteDoubt,
    toggleLikeDoubt,
    toggleSaveDoubt,
    reportDoubt,
    getReportedDoubts,
    permanentDeleteDoubt,
    updateReportStatus,
    getCommunityThreads,
    getThreadDetail,
    getSavedCommunityThreads,
    getMyCommunityPosts
} = require('../controllers/doubtController');

const threadDetailViewLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 90,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?._id?.toString() || rateLimit.ipKeyGenerator(req.ip || ''),
    message: { success: false, message: 'Too many detail requests. Please slow down.' }
});

// Admin routes (must be before :paramId routes)
router.get('/admin/reported', protect, authorize('ADMIN', 'SUPER_ADMIN'), getReportedDoubts);
router.delete('/admin/:doubtId/permanent', protect, authorize('ADMIN', 'SUPER_ADMIN'), permanentDeleteDoubt);
router.put('/admin/report/:reportId', protect, authorize('ADMIN', 'SUPER_ADMIN'), updateReportStatus);

// Community routes
router.get('/community', optionalProtect, getCommunityThreads);
router.get('/my-posts', protect, getMyCommunityPosts);
router.get('/saved', protect, getSavedCommunityThreads);
router.post('/create', protect, upload.single('image'), createDoubt);

// Comment actions
router.put('/:doubtId', protect, editDoubt);
router.delete('/:doubtId', protect, deleteDoubt);
router.post('/:doubtId/like', protect, toggleLikeDoubt);
router.post('/:doubtId/save', protect, toggleSaveDoubt);
router.post('/:doubtId/report', protect, reportDoubt);
router.get('/:commentId/replies', optionalProtect, getReplies);
router.get('/:doubtId/detail', optionalProtect, threadDetailViewLimiter, getThreadDetail);

// Problem-scoped routes
router.get('/problem/:problemId', optionalProtect, getDoubts);
router.post('/problem/:problemId', protect, upload.single('image'), createDoubt);

module.exports = router;
