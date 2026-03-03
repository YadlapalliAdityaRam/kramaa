const mongoose = require('mongoose');

const CONTEST_STATUSES = ['upcoming', 'running', 'completed'];

const computeContestStatus = ({ startTime, endTime }, referenceTime = new Date()) => {
    const now = new Date(referenceTime);
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now < start) return 'upcoming';
    if (now <= end) return 'running';
    return 'completed';
};

const ContestSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },
    description: {
        type: String,
        default: '',
        maxlength: 5000
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true,
        validate: {
            validator(value) {
                return this.startTime && new Date(value) > new Date(this.startTime);
            },
            message: 'endTime must be greater than startTime'
        }
    },
    registrationOpenDate: {
        type: Date,
        default: null,
        validate: {
            validator(value) {
                if (!value) return true;
                if (!this.startTime) return true;
                return new Date(value) <= new Date(this.startTime);
            },
            message: 'registrationOpenDate must be less than or equal to startTime'
        }
    },
    status: {
        type: String,
        enum: CONTEST_STATUSES,
        default: 'upcoming',
        index: true
    },
    approvalStatus: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'APPROVED',
        index: true
    },
    rejectionNote: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    problems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        required: true
    }],
    participantsCount: {
        type: Number,
        default: 0,
        min: 0
    },
    rules: [{
        type: String,
        trim: true,
        maxlength: 500
    }],
    wrongSubmissionPenalty: {
        enabled: { type: Boolean, default: false },
        minutes: { type: Number, default: 10, min: 1, max: 60 }
    }
}, {
    timestamps: true
});

ContestSchema.pre('validate', function () {
    if (this.startTime && this.endTime) {
        this.status = computeContestStatus(this);
    }
});

ContestSchema.methods.getComputedStatus = function getComputedStatus(referenceTime = new Date()) {
    return computeContestStatus(this, referenceTime);
};

ContestSchema.statics.computeStatus = function computeStatus(contestLike, referenceTime = new Date()) {
    return computeContestStatus(contestLike, referenceTime);
};

ContestSchema.statics.syncStatuses = async function syncStatuses(referenceTime = new Date()) {
    const now = new Date(referenceTime);

    await Promise.all([
        this.updateMany(
            { startTime: { $gt: now }, status: { $ne: 'upcoming' } },
            { $set: { status: 'upcoming' } }
        ),
        this.updateMany(
            { startTime: { $lte: now }, endTime: { $gte: now }, status: { $ne: 'running' } },
            { $set: { status: 'running' } }
        ),
        this.updateMany(
            { endTime: { $lt: now }, status: { $ne: 'completed' } },
            { $set: { status: 'completed' } }
        )
    ]);
};

ContestSchema.index({ startTime: 1, endTime: 1 });
ContestSchema.index({ createdAt: -1 });

const Contest = mongoose.model('Contest', ContestSchema);

Contest.CONTEST_STATUSES = CONTEST_STATUSES;
Contest.computeContestStatus = computeContestStatus;

module.exports = Contest;
