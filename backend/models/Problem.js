const mongoose = require('mongoose');
const Counter = require('./Counter');
const { normalizeProblemStatus, PROBLEM_STATUS } = require('../utils/problemPublication');
const {
    OUTPUT_VALIDATION_TYPES,
    DEFAULT_FLOAT_TOLERANCE,
    normalizeOutputValidationType,
    normalizeFloatTolerance
} = require('../utils/outputValidation');
const {
    normalizeAndValidateTestCases
} = require('../utils/problemTestCaseValidator');

const TestCaseSchema = new mongoose.Schema({
    input: { type: mongoose.Schema.Types.Mixed, required: true },
    output: { type: mongoose.Schema.Types.Mixed, default: null },
    validationType: {
        type: String,
        enum: Object.values(OUTPUT_VALIDATION_TYPES),
        default: OUTPUT_VALIDATION_TYPES.EXACT
    },
    isHidden: { type: Boolean, default: false }
});

const ReferenceSolutionSchema = new mongoose.Schema({
    code: { type: String, required: true },
    language: { type: String, required: true }
}, { _id: false });

const ProblemSchema = new mongoose.Schema({
    problemNumber: { type: Number, unique: true },
    title: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    descriptionImage: { type: String, default: '' },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        required: true
    },
    topic: { type: String, required: false }, // Deprecated, use topics[0]
    topics: [{ type: String }],
    tags: [String],
    companies: [String],
    constraints: String,
    hints: [String],
    examples: [{
        input: mongoose.Schema.Types.Mixed,
        output: mongoose.Schema.Types.Mixed,
        explanation: String
    }],
    sampleTestCases: [TestCaseSchema],
    hiddenTestCases: {
        type: [TestCaseSchema],
        select: false // Not selected by default for security
    },
    timeLimit: {
        type: Number,
        default: 1000 // 1 second
    },
    memoryLimit: {
        type: Number,
        default: 256 // 256 MB
    },
    referenceSolution: {
        type: ReferenceSolutionSchema,
        select: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    approvalStatus: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    approvalNote: {
        type: String
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Acceptance Rate Tracking
    totalSubmissions: { type: Number, default: 0 },
    totalAcceptedSubmissions: { type: Number, default: 0 },
    totalUniqueAttemptedUsers: { type: Number, default: 0 },
    totalUniqueSolvedUsers: { type: Number, default: 0 },
    submissionAcceptanceRate: { type: Number, default: 0 },
    userAcceptanceRate: { type: Number, default: 0 },
    className: {
        type: String,
        default: 'Solution'
    },
    functionName: {
        type: String,
        required: true,
        default: 'solve'
    },
    returnType: {
        type: String,
        required: true,
        default: 'void'
    },
    validationType: {
        type: String,
        enum: Object.values(OUTPUT_VALIDATION_TYPES),
        default: OUTPUT_VALIDATION_TYPES.EXACT,
        set: normalizeOutputValidationType
    },
    validationKey: {
        type: String,
        default: '',
        trim: true
    },
    tolerance: {
        type: Number,
        default: DEFAULT_FLOAT_TOLERANCE
    },
    parameters: [{
        name: { type: String, required: true },
        type: { type: String, required: true },
        isArray: { type: Boolean, default: false },
        is2D: { type: Boolean, default: false }
    }],
    starterCode: {
        javascript: String,
        python: String,
        java: String,
        cpp: String,
        c: String
    },
    xpReward: { type: Number, default: 10 },
    likesCount: { type: Number, default: 0 },
    dislikesCount: { type: Number, default: 0 },
    order: { type: Number, default: 0 },

    // Validation Gate Fields
    status: {
        type: String,
        enum: Object.values(PROBLEM_STATUS),
        default: PROBLEM_STATUS.PROPOSED,
        set: normalizeProblemStatus
    },
    validationStatus: {
        type: String,
        enum: ['NOT_VALIDATED', 'RUNNING', 'FAILED', 'PASSED'],
        default: 'NOT_VALIDATED'
    },
    lastValidationReport: {
        type: mongoose.Schema.Types.Mixed // Stores the detailed JSON report
    },
    publishedAt: {
        type: Date
    },
    // Editorial content
    editorial: {
        approaches: [{
            title: { type: String, required: true },
            description: { type: String, required: true },
            timeComplexity: String,
            spaceComplexity: String,
            code: String,
            codeLanguage: String,
            media: [{
                type: { type: String, enum: ['image', 'video'], required: true },
                url: { type: String, required: true },
                caption: String
            }]
        }],
        publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        publishedAt: Date
    },
    editorialPublished: { type: Boolean, default: false }
}, {
    timestamps: true,
    strict: true
});

ProblemSchema.pre('save', async function () {
    const currentParams = Array.isArray(this.parameters) ? this.parameters : [];
    const sampleResult = normalizeAndValidateTestCases(this.sampleTestCases || [], {
        parameters: currentParams,
        returnType: this.returnType,
        validationType: this.validationType,
        validationKey: this.validationKey,
        tolerance: normalizeFloatTolerance(this.tolerance),
        allowCoercion: false,
        fieldPrefix: 'sampleTestCases'
    });
    const hiddenResult = normalizeAndValidateTestCases(this.hiddenTestCases || [], {
        parameters: currentParams,
        returnType: this.returnType,
        validationType: this.validationType,
        validationKey: this.validationKey,
        tolerance: normalizeFloatTolerance(this.tolerance),
        allowCoercion: false,
        fieldPrefix: 'hiddenTestCases'
    });
    this.sampleTestCases = sampleResult.normalizedTestCases;
    this.hiddenTestCases = hiddenResult.normalizedTestCases;

    [...sampleResult.issues, ...hiddenResult.issues].forEach((issue) => {
        this.invalidate(issue.path, issue.message);
    });

    if (this.isNew && !this.problemNumber) {
        try {
            const counter = await Counter.findByIdAndUpdate(
                { _id: 'problemNumber' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this.problemNumber = counter.seq;
        } catch (error) {
            throw error;
        }
    }

    if (this.isModified('title')) {
        this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    if (this.isModified('status')) {
        this.status = normalizeProblemStatus(this.status);
    }

    if (this.isModified('validationType')) {
        this.validationType = normalizeOutputValidationType(this.validationType);
    }

    if (this.isModified('tolerance')) {
        this.tolerance = normalizeFloatTolerance(this.tolerance);
    }

    if (this.validationType !== OUTPUT_VALIDATION_TYPES.ANY_VALID) {
        this.validationKey = '';
    } else {
        this.validationKey = String(this.validationKey || '').trim();
    }

    if (this.isModified('status') || this.isModified('isPublished')) {
        const normalizedStatus = normalizeProblemStatus(this.status);
        const published = normalizedStatus === PROBLEM_STATUS.PUBLISHED || this.isPublished === true;

        this.isPublished = published;
        this.status = published ? PROBLEM_STATUS.PUBLISHED : normalizedStatus;

        if (published) {
            this.publishedAt = this.publishedAt || new Date();
        } else {
            this.publishedAt = null;
        }
    }
});

ProblemSchema.pre('findOneAndUpdate', async function () {
    const update = this.getUpdate() || {};
    const setUpdate = update.$set || {};

    const hasTestCaseUpdates = Object.prototype.hasOwnProperty.call(update, 'sampleTestCases')
        || Object.prototype.hasOwnProperty.call(update, 'hiddenTestCases')
        || Object.prototype.hasOwnProperty.call(setUpdate, 'sampleTestCases')
        || Object.prototype.hasOwnProperty.call(setUpdate, 'hiddenTestCases');

    const hasTypeContractUpdates = Object.prototype.hasOwnProperty.call(update, 'parameters')
        || Object.prototype.hasOwnProperty.call(update, 'returnType')
        || Object.prototype.hasOwnProperty.call(setUpdate, 'parameters')
        || Object.prototype.hasOwnProperty.call(setUpdate, 'returnType');

    const hasValidationContractUpdates = Object.prototype.hasOwnProperty.call(update, 'validationType')
        || Object.prototype.hasOwnProperty.call(update, 'validationKey')
        || Object.prototype.hasOwnProperty.call(update, 'tolerance')
        || Object.prototype.hasOwnProperty.call(setUpdate, 'validationType')
        || Object.prototype.hasOwnProperty.call(setUpdate, 'validationKey')
        || Object.prototype.hasOwnProperty.call(setUpdate, 'tolerance');

    if (!hasTestCaseUpdates && !hasTypeContractUpdates && !hasValidationContractUpdates) return;

    const existingProblem = await this.model.findOne(this.getQuery())
        .select('+hiddenTestCases parameters returnType validationType validationKey tolerance sampleTestCases')
        .lean();

    let parameters = null;
    if (Array.isArray(update.parameters)) {
        parameters = update.parameters;
    } else if (Array.isArray(setUpdate.parameters)) {
        parameters = setUpdate.parameters;
    } else {
        parameters = Array.isArray(existingProblem?.parameters) ? existingProblem.parameters : [];
    }

    let returnType = null;
    if (typeof update.returnType === 'string') {
        returnType = update.returnType;
    } else if (typeof setUpdate.returnType === 'string') {
        returnType = setUpdate.returnType;
    } else {
        returnType = existingProblem?.returnType || 'void';
    }

    let validationType = null;
    if (typeof update.validationType === 'string') {
        validationType = update.validationType;
    } else if (typeof setUpdate.validationType === 'string') {
        validationType = setUpdate.validationType;
    } else {
        validationType = existingProblem?.validationType || OUTPUT_VALIDATION_TYPES.EXACT;
    }

    let validationKey = null;
    if (typeof update.validationKey === 'string') {
        validationKey = update.validationKey;
    } else if (typeof setUpdate.validationKey === 'string') {
        validationKey = setUpdate.validationKey;
    } else {
        validationKey = existingProblem?.validationKey || '';
    }

    let tolerance = null;
    if (Object.prototype.hasOwnProperty.call(update, 'tolerance')) {
        tolerance = update.tolerance;
    } else if (Object.prototype.hasOwnProperty.call(setUpdate, 'tolerance')) {
        tolerance = setUpdate.tolerance;
    } else {
        tolerance = existingProblem?.tolerance;
    }

    const allIssues = [];
    if (Object.prototype.hasOwnProperty.call(update, 'sampleTestCases')) {
        const result = normalizeAndValidateTestCases(update.sampleTestCases, {
            parameters,
            returnType,
            validationType,
            validationKey,
            tolerance,
            allowCoercion: false,
            fieldPrefix: 'sampleTestCases'
        });
        update.sampleTestCases = result.normalizedTestCases;
        allIssues.push(...result.issues);
    }
    if (Object.prototype.hasOwnProperty.call(update, 'hiddenTestCases')) {
        const result = normalizeAndValidateTestCases(update.hiddenTestCases, {
            parameters,
            returnType,
            validationType,
            validationKey,
            tolerance,
            allowCoercion: false,
            fieldPrefix: 'hiddenTestCases'
        });
        update.hiddenTestCases = result.normalizedTestCases;
        allIssues.push(...result.issues);
    }
    if (Object.prototype.hasOwnProperty.call(setUpdate, 'sampleTestCases')) {
        const result = normalizeAndValidateTestCases(setUpdate.sampleTestCases, {
            parameters,
            returnType,
            validationType,
            validationKey,
            tolerance,
            allowCoercion: false,
            fieldPrefix: 'sampleTestCases'
        });
        setUpdate.sampleTestCases = result.normalizedTestCases;
        allIssues.push(...result.issues);
    }
    if (Object.prototype.hasOwnProperty.call(setUpdate, 'hiddenTestCases')) {
        const result = normalizeAndValidateTestCases(setUpdate.hiddenTestCases, {
            parameters,
            returnType,
            validationType,
            validationKey,
            tolerance,
            allowCoercion: false,
            fieldPrefix: 'hiddenTestCases'
        });
        setUpdate.hiddenTestCases = result.normalizedTestCases;
        allIssues.push(...result.issues);
    }

    if ((hasTypeContractUpdates || hasValidationContractUpdates) && !hasTestCaseUpdates) {
        const sampleResult = normalizeAndValidateTestCases(existingProblem?.sampleTestCases || [], {
            parameters,
            returnType,
            validationType,
            validationKey,
            tolerance,
            allowCoercion: false,
            fieldPrefix: 'sampleTestCases'
        });
        const hiddenResult = normalizeAndValidateTestCases(existingProblem?.hiddenTestCases || [], {
            parameters,
            returnType,
            validationType,
            validationKey,
            tolerance,
            allowCoercion: false,
            fieldPrefix: 'hiddenTestCases'
        });

        allIssues.push(...sampleResult.issues, ...hiddenResult.issues);
        setUpdate.sampleTestCases = sampleResult.normalizedTestCases;
        setUpdate.hiddenTestCases = hiddenResult.normalizedTestCases;
    }

    if (allIssues.length > 0) {
        const validationError = new mongoose.Error.ValidationError();
        allIssues.forEach((issue) => {
            validationError.addError(
                issue.path,
                new mongoose.Error.ValidatorError({
                    path: issue.path,
                    message: issue.message
                })
            );
        });
        throw validationError;
    }

    if (Object.keys(setUpdate).length > 0) {
        update.$set = setUpdate;
    }

    this.setUpdate(update);
});

// Published-only dashboards/graphs rely on these indexes.
ProblemSchema.index({ status: 1, createdAt: -1 });
ProblemSchema.index({ status: 1, difficulty: 1 });
ProblemSchema.index({ status: 1, topics: 1 });
ProblemSchema.index({ status: 1, tags: 1 });

module.exports = mongoose.model('Problem', ProblemSchema);
