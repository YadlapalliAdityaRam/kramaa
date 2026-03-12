const { body, param } = require('express-validator');

const contestIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid contest id')
];

const createContestValidation = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('title is required')
        .isLength({ max: 150 })
        .withMessage('title cannot exceed 150 characters'),
    body('description')
        .optional()
        .isString()
        .withMessage('description must be a string')
        .isLength({ max: 5000 })
        .withMessage('description cannot exceed 5000 characters'),
    body('startTime')
        .notEmpty()
        .withMessage('startTime is required')
        .isISO8601()
        .withMessage('startTime must be a valid ISO date'),
    body('endTime')
        .notEmpty()
        .withMessage('endTime is required')
        .isISO8601()
        .withMessage('endTime must be a valid ISO date')
        .custom((value, { req }) => {
            const start = new Date(req.body.startTime);
            const end = new Date(value);
            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
                return false;
            }

            if (end <= start) {
                throw new Error('endTime must be greater than startTime');
            }

            return true;
        }),
    body('registrationOpenDate')
        .optional({ nullable: true, checkFalsy: true })
        .isISO8601()
        .withMessage('registrationOpenDate must be a valid ISO date')
        .custom((value, { req }) => {
            if (!value) return true;
            const start = new Date(req.body.startTime);
            const registrationOpenDate = new Date(value);
            if (Number.isNaN(start.getTime()) || Number.isNaN(registrationOpenDate.getTime())) {
                return false;
            }

            if (registrationOpenDate > start) {
                throw new Error('registrationOpenDate must be less than or equal to startTime');
            }

            return true;
        }),
    body('problems')
        .isArray({ min: 1 })
        .withMessage('problems must be a non-empty array'),
    body('problems.*.problem')
        .notEmpty()
        .withMessage('each problem entry must have a problem id')
        .isMongoId()
        .withMessage('each problem id must be a valid ObjectId'),
    body('problems.*.points')
        .optional()
        .isNumeric()
        .withMessage('points must be a number'),
    body('problems.*.baseScore')
        .optional()
        .isNumeric()
        .withMessage('baseScore must be a number'),
    body('problems.*.difficulty')
        .optional()
        .isIn(['Easy', 'Medium', 'Hard', 'easy', 'medium', 'hard'])
        .withMessage('difficulty must be Easy, Medium, or Hard'),
    body('problems.*.order')
        .optional()
        .isNumeric()
        .withMessage('order must be a number'),
    body('rules')
        .optional()
        .isArray()
        .withMessage('rules must be an array'),
    body('rules.*')
        .optional()
        .isString()
        .withMessage('each rule must be a string'),
    body('scoringConfig')
        .optional()
        .isObject()
        .withMessage('scoringConfig must be an object'),
    body('scoringConfig.easyBaseScore')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('scoringConfig.easyBaseScore must be >= 0'),
    body('scoringConfig.mediumBaseScore')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('scoringConfig.mediumBaseScore must be >= 0'),
    body('scoringConfig.hardBaseScore')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('scoringConfig.hardBaseScore must be >= 0'),
    body('scoringConfig.timePenaltyPerMinute')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('scoringConfig.timePenaltyPerMinute must be >= 0'),
    body('scoringConfig.wrongAttemptPenalty')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('scoringConfig.wrongAttemptPenalty must be >= 0'),
    body('exitRules')
        .optional()
        .isObject()
        .withMessage('exitRules must be an object'),
    body('exitRules.allowRejoin')
        .optional()
        .isBoolean()
        .withMessage('exitRules.allowRejoin must be boolean'),
    body('exitRules.autoExitOnInactivity')
        .optional()
        .isBoolean()
        .withMessage('exitRules.autoExitOnInactivity must be boolean'),
    body('exitRules.inactivityTimeoutMinutes')
        .optional()
        .isInt({ min: 5, max: 120 })
        .withMessage('exitRules.inactivityTimeoutMinutes must be between 5 and 120')
];

module.exports = {
    contestIdValidation,
    createContestValidation
};
