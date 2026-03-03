const buildContestAnnouncementPayload = (contestDoc) => {
    if (!contestDoc) return null;

    const contest = typeof contestDoc.toObject === 'function'
        ? contestDoc.toObject()
        : contestDoc;

    const contestId = contest._id ? String(contest._id) : (contest.id ? String(contest.id) : '');
    if (!contestId) return null;

    return {
        contestId,
        title: contest.title || '',
        description: contest.description || '',
        startTime: contest.startTime ? new Date(contest.startTime).toISOString() : null,
        endTime: contest.endTime ? new Date(contest.endTime).toISOString() : null,
        registrationOpenDate: contest.registrationOpenDate ? new Date(contest.registrationOpenDate).toISOString() : null,
        createdAt: contest.createdAt ? new Date(contest.createdAt).toISOString() : new Date().toISOString()
    };
};

const emitContestPublished = (io, contestDoc) => {
    if (!io || typeof io.emit !== 'function') return;

    const payload = buildContestAnnouncementPayload(contestDoc);
    if (!payload) return;

    io.emit('contest_published', payload);
};

module.exports = {
    buildContestAnnouncementPayload,
    emitContestPublished
};
