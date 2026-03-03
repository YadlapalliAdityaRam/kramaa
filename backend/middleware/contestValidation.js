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
        .withMessage('each rule must be a string')
];

module.exports = {
    contestIdValidation,
    createContestValidation
};
