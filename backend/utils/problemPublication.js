const PROBLEM_STATUS = Object.freeze({
    PROPOSED: 'proposed',
    APPROVED: 'approved',
    PUBLISHED: 'published'
});

const LEGACY_STATUS_MAP = Object.freeze({
    DRAFT: PROBLEM_STATUS.PROPOSED,
    READY_TO_PUBLISH: PROBLEM_STATUS.APPROVED,
    PUBLISHED: PROBLEM_STATUS.PUBLISHED
});

const normalizeProblemStatus = (rawStatus) => {
    const normalized = String(rawStatus || '').trim();
    if (!normalized) return PROBLEM_STATUS.PROPOSED;

    if (LEGACY_STATUS_MAP[normalized]) {
        return LEGACY_STATUS_MAP[normalized];
    }

    const lower = normalized.toLowerCase();
    if (lower === PROBLEM_STATUS.PROPOSED) return PROBLEM_STATUS.PROPOSED;
    if (lower === PROBLEM_STATUS.APPROVED) return PROBLEM_STATUS.APPROVED;
    if (lower === PROBLEM_STATUS.PUBLISHED) return PROBLEM_STATUS.PUBLISHED;

    return PROBLEM_STATUS.PROPOSED;
};

const isPublishedStatus = (status) => normalizeProblemStatus(status) === PROBLEM_STATUS.PUBLISHED;

const isPublishedProblem = (problem) => {
    if (!problem || typeof problem !== 'object') return false;
    if (problem.isPublished === true) return true;
    return isPublishedStatus(problem.status);
};

const getPublishedProblemClauses = () => ([
    { status: PROBLEM_STATUS.PUBLISHED },
    { status: 'PUBLISHED' },
    { isPublished: true }
]);

const buildPublishedProblemMatch = (base = {}) => ({
    $and: [
        base,
        { $or: getPublishedProblemClauses() }
    ]
});

const buildUnpublishedProblemMatch = (base = {}) => ({
    $and: [
        base,
        { $nor: getPublishedProblemClauses() }
    ]
});

const resolveLifecycleStatus = ({ incomingStatus, incomingIsPublished, currentStatus }) => {
    if (incomingStatus !== undefined && incomingStatus !== null && String(incomingStatus).trim() !== '') {
        return normalizeProblemStatus(incomingStatus);
    }

    if (typeof incomingIsPublished === 'boolean') {
        if (incomingIsPublished) return PROBLEM_STATUS.PUBLISHED;
        const normalizedCurrent = normalizeProblemStatus(currentStatus);
        return normalizedCurrent === PROBLEM_STATUS.PUBLISHED
            ? PROBLEM_STATUS.APPROVED
            : normalizedCurrent;
    }

    return normalizeProblemStatus(currentStatus);
};

const buildPublicationFields = (nextStatus, currentPublishedAt = null, now = new Date()) => {
    const normalized = normalizeProblemStatus(nextStatus);
    if (normalized === PROBLEM_STATUS.PUBLISHED) {
        return {
            status: PROBLEM_STATUS.PUBLISHED,
            isPublished: true,
            publishedAt: currentPublishedAt || now
        };
    }

    return {
        status: normalized,
        isPublished: false,
        publishedAt: null
    };
};

module.exports = {
    PROBLEM_STATUS,
    normalizeProblemStatus,
    isPublishedStatus,
    isPublishedProblem,
    buildPublishedProblemMatch,
    buildUnpublishedProblemMatch,
    resolveLifecycleStatus,
    buildPublicationFields
};
