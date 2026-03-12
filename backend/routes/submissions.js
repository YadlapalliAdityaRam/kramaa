const express = require('express');
const router = express.Router();
const { runCode, submitSolution, getMySubmissions, getLastSubmission, getAllSubmissions, runSampleTests, getSubmissionPerformance, getProblemSolutions } = require('../controllers/submissionController');
const { protect, optionalProtect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const {
    runCodeValidation,
    runSampleTestsValidation,
    submitSolutionValidation,
    getLastSubmissionValidation,
    getSubmissionPerformanceValidation
} = require('../middleware/submissionValidation');

router.post('/run', protect, runCodeValidation, validateRequest, runCode);
router.post('/run-samples', protect, runSampleTestsValidation, validateRequest, runSampleTests);
router.post('/submit', protect, submitSolutionValidation, validateRequest, submitSolution);
router.get('/my-submissions', protect, getMySubmissions);
router.get('/problem/:problemId/solutions', optionalProtect, getProblemSolutions);
router.get('/last/:problemId', protect, getLastSubmissionValidation, validateRequest, getLastSubmission);
router.get('/performance/:submissionId', protect, getSubmissionPerformanceValidation, validateRequest, getSubmissionPerformance);

// Admin / Super Admin only
router.get('/all', protect, authorize('ADMIN', 'SUPER_ADMIN'), getAllSubmissions);

module.exports = router;
