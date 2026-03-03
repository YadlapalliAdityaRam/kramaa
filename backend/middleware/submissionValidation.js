const { body, param, query } = require('express-validator');

const ALLOWED_LANGUAGES = ['javascript', 'python', 'java', 'cpp', 'c'];

const normalizeLanguage = body('language')
    .trim()
    .toLowerCase()
    .isIn(ALLOWED_LANGUAGES)
    .withMessage(`Language must be one of: ${ALLOWED_LANGUAGES.join(', ')}`);

const validateCode = body('code')
    .isString()
    .withMessage('Code is required.')
    .isLength({ min: 1, max: 100000 })
    .withMessage('Code must be between 1 and 100000 characters.');

const validateProblemIdBody = body('problemId')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Invalid problem id.');

const validateContestIdBody = body('contestId')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isMongoId()
    .withMessage('Invalid contest id.');

const runCodeValidation = [
    validateCode,
    normalizeLanguage,
    validateProblemIdBody,
    body('input')
        .optional()
        .custom((input) => {
            const serialized = JSON.stringify(input ?? '');
            if (serialized.length > 20000) {
                throw new Error('Input is too large.');
            }
            return true;
        })
];

const runSampleTestsValidation = [
    validateCode,
    normalizeLanguage,
    body('problemId')
        .trim()
        .isMongoId()
        .withMessage('A valid problemId is required.')
];

const submitSolutionValidation = [
    validateCode,
    normalizeLanguage,
    body('problemId')
        .trim()
        .isMongoId()
        .withMessage('A valid problemId is required.'),
    validateContestIdBody
];

const getLastSubmissionValidation = [
    param('problemId')
        .trim()
        .isMongoId()
        .withMessage('Invalid problem id.'),
    query('language')
        .optional()
        .trim()
        .toLowerCase()
        .isIn(ALLOWED_LANGUAGES)
        .withMessage(`Language must be one of: ${ALLOWED_LANGUAGES.join(', ')}`)
];

const getSubmissionPerformanceValidation = [
    param('submissionId')
        .trim()
        .isMongoId()
        .withMessage('Invalid submission id.')
];

module.exports = {
    ALLOWED_LANGUAGES,
    runCodeValidation,
    runSampleTestsValidation,
    submitSolutionValidation,
    getLastSubmissionValidation,
    getSubmissionPerformanceValidation
};
