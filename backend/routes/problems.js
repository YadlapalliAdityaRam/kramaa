const express = require('express');
const router = express.Router();
const { protect, authorize, optionalProtect } = require('../middleware/auth');
const problemController = require('../controllers/problemController');
const topicController = require('../controllers/topicController');
const { getAllProblems, createProblem, updateProblem, deleteProblem, getAdminProblems } = problemController;

// ═══ Static routes first (before /:id param routes) ═══
router.get('/', getAllProblems);
router.get('/admin-list', protect, authorize('ADMIN', 'SUPER_ADMIN'), getAdminProblems);
router.get('/admin/all', protect, authorize('ADMIN', 'SUPER_ADMIN'), getAdminProblems);
router.get('/stats', protect, authorize('ADMIN', 'SUPER_ADMIN'), problemController.getPublishedProblemStats);
router.get('/company/:companyName/stats', problemController.getCompanyStats);
router.get('/topics', topicController.getAllTopics);
router.post('/topics/seed', protect, authorize('SUPER_ADMIN'), topicController.seedTopics);

// ═══ Param routes (must come after static routes) ═══
router.get('/:id', optionalProtect, problemController.getProblem);
router.post('/:id/like', protect, problemController.likeProblem);
router.delete('/:id/like', protect, problemController.unlikeProblem);
router.post('/:id/react', protect, problemController.reactToProblem);
router.post('/', protect, authorize('ADMIN', 'SUPER_ADMIN'), createProblem);
router.put('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), updateProblem);

// Validation Gate Routes
router.post('/:id/validate', protect, authorize('ADMIN', 'SUPER_ADMIN'), problemController.validateProblem);
router.get('/:id/validation-report', protect, authorize('ADMIN', 'SUPER_ADMIN'), problemController.getValidationReport);
router.post('/:id/publish', protect, authorize('ADMIN', 'SUPER_ADMIN'), problemController.publishProblem);
router.post('/:id/solutions', protect, authorize('ADMIN', 'SUPER_ADMIN'), problemController.addSolution);
router.post('/:id/generator', protect, authorize('ADMIN', 'SUPER_ADMIN'), problemController.setGenerator);
router.get('/:id/validation-data', protect, authorize('ADMIN', 'SUPER_ADMIN'), problemController.getValidationData);
router.post('/:id/generate-ai-testcases', protect, authorize('ADMIN', 'SUPER_ADMIN'), require('../controllers/aiController').generateTestCases);
router.post('/:id/testcases', protect, authorize('ADMIN', 'SUPER_ADMIN'), problemController.addTestCases);

// Editorial Routes
router.get('/:id/editorial', optionalProtect, problemController.getEditorial);
router.put('/:id/editorial', protect, authorize('ADMIN', 'SUPER_ADMIN'), problemController.saveEditorial);

// Bookmark
router.post('/:id/bookmark', protect, problemController.toggleBookmark);

router.delete('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), deleteProblem);

module.exports = router;
