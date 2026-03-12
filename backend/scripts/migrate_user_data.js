const mongoose = require('mongoose');
const dotenv = require('dotenv');

const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const AuditLog = require('../models/AuditLog');
const AuthOtp = require('../models/AuthOtp');
const CommentReaction = require('../models/CommentReaction');
const CommentReport = require('../models/CommentReport');
const Contest = require('../models/Contest');
const ContestParticipant = require('../models/ContestParticipant');
const Doubt = require('../models/Doubt');
const DoubtView = require('../models/DoubtView');
const Notification = require('../models/Notification');
const Problem = require('../models/Problem');
const ProblemLike = require('../models/ProblemLike');
const Profile = require('../models/Profile');
const Progress = require('../models/Progress');
const Report = require('../models/Report');
const Setting = require('../models/Setting');
const Submission = require('../models/Submission');
const Ticket = require('../models/Ticket');
const TicketDecision = require('../models/TicketDecision');
const TicketMessage = require('../models/TicketMessage');
const UserAnalytics = require('../models/UserAnalytics');

dotenv.config();

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const parseArgs = (argv) => {
    const options = {
        fromEmail: '',
        toEmail: '',
        apply: false,
        deleteSource: false
    };

    argv.slice(2).forEach((arg) => {
        if (arg === '--apply') options.apply = true;
        if (arg === '--dry-run') options.apply = false;
        if (arg === '--delete-source') options.deleteSource = true;

        if (arg.startsWith('--from-email=')) {
            options.fromEmail = normalizeEmail(arg.slice('--from-email='.length));
        }
        if (arg.startsWith('--to-email=')) {
            options.toEmail = normalizeEmail(arg.slice('--to-email='.length));
        }
    });

    return options;
};

const buildEmailCandidates = (email) => {
    const normalized = normalizeEmail(email);
    const candidates = new Set([normalized]);
    if (normalized.includes('@gamil.com')) {
        candidates.add(normalized.replace('@gamil.com', '@gmail.com'));
    }
    if (normalized.includes('@gmail.com')) {
        candidates.add(normalized.replace('@gmail.com', '@gamil.com'));
    }
    return [...candidates];
};

const toId = (value) => String(value || '');

const unionObjectIds = (...arrays) => {
    const seen = new Set();
    const result = [];
    arrays
        .filter(Array.isArray)
        .forEach((arr) => {
            arr.forEach((item) => {
                const key = toId(item);
                if (!key || seen.has(key)) return;
                seen.add(key);
                result.push(item);
            });
        });
    return result;
};

const mergeBadges = (targetBadges = [], sourceBadges = []) => {
    const map = new Map();
    [...targetBadges, ...sourceBadges].forEach((badge) => {
        if (!badge || !badge.id) return;
        const existing = map.get(badge.id);
        if (!existing) {
            map.set(badge.id, badge);
            return;
        }
        const existingDate = existing.earnedAt ? new Date(existing.earnedAt).getTime() : Number.POSITIVE_INFINITY;
        const candidateDate = badge.earnedAt ? new Date(badge.earnedAt).getTime() : Number.POSITIVE_INFINITY;
        if (candidateDate < existingDate) {
            map.set(badge.id, { ...existing, ...badge, earnedAt: badge.earnedAt });
        }
    });
    return [...map.values()];
};

const mergeRatingHistory = (targetHistory = [], sourceHistory = []) => {
    const map = new Map();
    [...targetHistory, ...sourceHistory].forEach((entry) => {
        if (!entry) return;
        const contestId = entry.contestId ? toId(entry.contestId) : '';
        const date = entry.date ? new Date(entry.date).toISOString() : '';
        const key = `${contestId}|${date}|${entry.rating ?? ''}|${entry.change ?? ''}`;
        if (!map.has(key)) map.set(key, entry);
    });
    return [...map.values()].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
};

const mergeProgressDoc = (target, source) => {
    target.totalProblems = Math.max(target.totalProblems || 0, source.totalProblems || 0);
    target.solvedProblems = Math.max(target.solvedProblems || 0, source.solvedProblems || 0);
    target.masteryLevel = Math.max(target.masteryLevel || 0, source.masteryLevel || 0);
};

const mergeContestParticipantDoc = (target, source) => {
    target.score = Math.max(target.score || 0, source.score || 0);
    target.solvedCount = Math.max(target.solvedCount || 0, source.solvedCount || 0);
    target.penalty = Math.min(
        target.penalty == null ? Number.MAX_SAFE_INTEGER : target.penalty,
        source.penalty == null ? Number.MAX_SAFE_INTEGER : source.penalty
    );
    if (target.penalty === Number.MAX_SAFE_INTEGER) target.penalty = 0;
    target.wrongSubmissions = Math.max(target.wrongSubmissions || 0, source.wrongSubmissions || 0);
    target.solvedProblemIds = unionObjectIds(target.solvedProblemIds, source.solvedProblemIds);
    if (!target.lastSubmissionTime || (source.lastSubmissionTime && new Date(source.lastSubmissionTime) > new Date(target.lastSubmissionTime))) {
        target.lastSubmissionTime = source.lastSubmissionTime;
    }
};

const mergeUserAnalyticsDoc = (target, source) => {
    const mergeNestedMap = (targetMap, sourceMap, fields) => {
        const next = new Map();
        if (targetMap instanceof Map) {
            targetMap.forEach((value, key) => next.set(key, { ...value }));
        } else if (targetMap && typeof targetMap === 'object') {
            Object.entries(targetMap).forEach(([key, value]) => next.set(key, { ...value }));
        }

        if (sourceMap instanceof Map) {
            sourceMap.forEach((value, key) => {
                const existing = next.get(key) || {};
                const merged = { ...existing };
                fields.forEach(({ name, mode }) => {
                    const a = Number(existing[name] || 0);
                    const b = Number((value || {})[name] || 0);
                    if (mode === 'max') merged[name] = Math.max(a, b);
                    else if (mode === 'avg') {
                        merged[name] = a && b ? Number(((a + b) / 2).toFixed(2)) : Math.max(a, b);
                    } else {
                        merged[name] = a + b;
                    }
                });
                next.set(key, merged);
            });
        } else if (sourceMap && typeof sourceMap === 'object') {
            Object.entries(sourceMap).forEach(([key, value]) => {
                const existing = next.get(key) || {};
                const merged = { ...existing };
                fields.forEach(({ name, mode }) => {
                    const a = Number(existing[name] || 0);
                    const b = Number((value || {})[name] || 0);
                    if (mode === 'max') merged[name] = Math.max(a, b);
                    else if (mode === 'avg') {
                        merged[name] = a && b ? Number(((a + b) / 2).toFixed(2)) : Math.max(a, b);
                    } else {
                        merged[name] = a + b;
                    }
                });
                next.set(key, merged);
            });
        }
        return next;
    };

    target.languageStats = mergeNestedMap(target.languageStats, source.languageStats, [
        { name: 'solved', mode: 'sum' },
        { name: 'attempted', mode: 'sum' },
        { name: 'avgRuntime', mode: 'avg' },
        { name: 'avgMemory', mode: 'avg' }
    ]);

    target.tagStats = mergeNestedMap(target.tagStats, source.tagStats, [
        { name: 'solved', mode: 'sum' },
        { name: 'attempted', mode: 'sum' },
        { name: 'avgTimeTaken', mode: 'avg' },
        { name: 'efficiency', mode: 'avg' }
    ]);

    const targetHeatmap = target.heatmap instanceof Map ? target.heatmap : new Map(Object.entries(target.heatmap || {}));
    const sourceHeatmap = source.heatmap instanceof Map ? source.heatmap : new Map(Object.entries(source.heatmap || {}));
    sourceHeatmap.forEach((value, key) => {
        const current = Number(targetHeatmap.get(key) || 0);
        targetHeatmap.set(key, current + Number(value || 0));
    });
    target.heatmap = targetHeatmap;

    target.insights = target.insights || {};
    source.insights = source.insights || {};
    target.insights.weakTopics = [...new Set([...(target.insights.weakTopics || []), ...(source.insights.weakTopics || [])])];
    target.insights.strongTopics = [...new Set([...(target.insights.strongTopics || []), ...(source.insights.strongTopics || [])])];
    target.insights.overconfidenceScore = Math.max(Number(target.insights.overconfidenceScore || 0), Number(source.insights.overconfidenceScore || 0));
    target.insights.consistencyScore = Math.max(Number(target.insights.consistencyScore || 0), Number(source.insights.consistencyScore || 0));
    if (!target.insights.learnerType || target.insights.learnerType === 'Unclassified') {
        target.insights.learnerType = source.insights.learnerType || target.insights.learnerType;
    }
    target.lastCalculated = new Date();
};

const mergeProfileDoc = (target, source) => {
    const copyIfEmpty = (path, sourceValue) => {
        if (sourceValue == null || sourceValue === '') return;
        if (path == null) return;
        if (typeof path === 'string') return;
    };

    if ((!target.bio || target.bio.trim() === '') && source.bio) target.bio = source.bio;
    if ((!target.title || target.title.trim() === '' || target.title === 'Coder') && source.title) target.title = source.title;
    if ((!target.website || target.website.trim() === '') && source.website) target.website = source.website;
    if ((!target.coverPhoto || target.coverPhoto === 'default-cover.jpg') && source.coverPhoto) target.coverPhoto = source.coverPhoto;
    if ((!target.experienceLevel || target.experienceLevel === 'Beginner') && source.experienceLevel) target.experienceLevel = source.experienceLevel;

    target.skills = [...new Set([...(target.skills || []), ...(source.skills || [])])];

    target.social = target.social || {};
    source.social = source.social || {};
    ['github', 'linkedin', 'twitter', 'portfolio', 'leetcode', 'codeforces'].forEach((key) => {
        if ((!target.social[key] || target.social[key].trim() === '') && source.social[key]) {
            target.social[key] = source.social[key];
        }
    });

    target.location = target.location || {};
    source.location = source.location || {};
    ['country', 'state', 'timezone'].forEach((key) => {
        if ((!target.location[key] || target.location[key].trim() === '') && source.location[key]) {
            target.location[key] = source.location[key];
        }
    });

    target.educationDetails = target.educationDetails || {};
    source.educationDetails = source.educationDetails || {};
    ['college', 'degree', 'branch', 'yearOfStudy', 'graduationYear'].forEach((key) => {
        if ((!target.educationDetails[key] || String(target.educationDetails[key]).trim() === '') && source.educationDetails[key]) {
            target.educationDetails[key] = source.educationDetails[key];
        }
    });

    const mergedEducation = [...(target.education || [])];
    const seen = new Set(mergedEducation.map((entry) => JSON.stringify(entry)));
    (source.education || []).forEach((entry) => {
        const key = JSON.stringify(entry);
        if (!seen.has(key)) {
            seen.add(key);
            mergedEducation.push(entry);
        }
    });
    target.education = mergedEducation;
};

const findUserByEmailCandidates = async (emails) => {
    const candidates = emails.map(normalizeEmail).filter(Boolean);
    if (candidates.length === 0) return null;
    return User.findOne({ email: { $in: candidates } });
};

const safeUpdateMany = async (model, filter, update, session, dryRun, label, counts) => {
    const matched = await model.countDocuments(filter).session(session);
    counts[label] = { matched, modified: dryRun ? 0 : matched };
    if (!dryRun && matched > 0) {
        await model.updateMany(filter, update, { session });
    }
};

const migrateUniqueByKeys = async ({
    model,
    userField,
    keyFields,
    sourceId,
    targetId,
    session,
    dryRun,
    label,
    counts,
    onDuplicate
}) => {
    const docs = await model.find({ [userField]: sourceId }).session(session);
    if (!docs.length) {
        counts[label] = { matched: 0, moved: 0, merged: 0, deleted: 0 };
        return;
    }

    let moved = 0;
    let merged = 0;
    let deleted = 0;

    for (const doc of docs) {
        const duplicateFilter = {};
        keyFields.forEach((field) => {
            duplicateFilter[field] = doc[field];
        });
        duplicateFilter[userField] = targetId;

        const duplicate = await model.findOne(duplicateFilter).session(session);
        if (!duplicate) {
            moved += 1;
            if (!dryRun) {
                doc[userField] = targetId;
                await doc.save({ session });
            }
            continue;
        }

        merged += 1;
        if (!dryRun && typeof onDuplicate === 'function') {
            await onDuplicate({ sourceDoc: doc, targetDoc: duplicate, session });
        }
        deleted += 1;
        if (!dryRun) {
            await model.deleteOne({ _id: doc._id }, { session });
        }
    }

    counts[label] = { matched: docs.length, moved, merged, deleted };
};

const recomputeSubmissionStats = async (userId, session, dryRun, counts) => {
    const submissions = await Submission.find({ user: userId }).select('problem status').session(session).lean();
    const problemIds = [...new Set(submissions.map((s) => toId(s.problem)).filter(Boolean))];
    const acceptedByProblem = new Set(
        submissions
            .filter((s) => s.status === 'accepted' && s.problem)
            .map((s) => toId(s.problem))
    );

    const acceptedProblemDocs = problemIds.length
        ? await Problem.find({ _id: { $in: [...acceptedByProblem] } }).select('_id difficulty').session(session).lean()
        : [];

    const easySolved = acceptedProblemDocs.filter((p) => p.difficulty === 'Easy').length;
    const mediumSolved = acceptedProblemDocs.filter((p) => p.difficulty === 'Medium').length;
    const hardSolved = acceptedProblemDocs.filter((p) => p.difficulty === 'Hard').length;
    const totalSubmissions = submissions.length;
    const acceptedSubmissions = submissions.filter((s) => s.status === 'accepted').length;
    const acceptanceRate = totalSubmissions ? Number(((acceptedSubmissions / totalSubmissions) * 100).toFixed(2)) : 0;

    counts.userStats = {
        totalSubmissions,
        acceptedSubmissions,
        easySolved,
        mediumSolved,
        hardSolved,
        uniqueSolved: acceptedByProblem.size
    };

    if (!dryRun) {
        await User.updateOne(
            { _id: userId },
            {
                $set: {
                    stats: {
                        totalProblems: acceptedByProblem.size,
                        easySolved,
                        mediumSolved,
                        hardSolved,
                        totalSubmissions,
                        acceptedSubmissions
                    },
                    totalSolvedEasy: easySolved,
                    totalSolvedMedium: mediumSolved,
                    totalSolvedHard: hardSolved,
                    problemAcceptanceRate: acceptanceRate
                }
            },
            { session }
        );
    }
};

const run = async () => {
    const options = parseArgs(process.argv);
    if (!options.fromEmail || !options.toEmail) {
        throw new Error('Usage: node scripts/migrate_user_data.js --from-email=<source> --to-email=<target> [--apply] [--delete-source]');
    }
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is required');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    const session = await mongoose.startSession();

    const counts = {};
    let fromUser = null;
    let toUser = null;
    let resolvedTargetEmail = options.toEmail;

    try {
        await session.withTransaction(async () => {
            fromUser = await User.findOne({ email: normalizeEmail(options.fromEmail) }).session(session);
            if (!fromUser) {
                throw new Error(`Source user not found for email: ${options.fromEmail}`);
            }

            const toCandidates = buildEmailCandidates(options.toEmail);
            toUser = await findUserByEmailCandidates(toCandidates);
            if (!toUser) {
                throw new Error(`Target user not found for email candidates: ${toCandidates.join(', ')}`);
            }
            resolvedTargetEmail = toUser.email;

            if (toId(fromUser._id) === toId(toUser._id)) {
                throw new Error('Source and target resolve to the same user.');
            }

            const dryRun = !options.apply;
            const sourceId = fromUser._id;
            const targetId = toUser._id;

            await safeUpdateMany(ActivityLog, { user: sourceId }, { $set: { user: targetId } }, session, dryRun, 'activityLog.user', counts);
            await safeUpdateMany(AuditLog, { actor: sourceId }, { $set: { actor: targetId } }, session, dryRun, 'auditLog.actor', counts);
            await safeUpdateMany(AuthOtp, { user: sourceId }, { $set: { user: targetId, email: toUser.email } }, session, dryRun, 'authOtp.user', counts);
            await safeUpdateMany(Doubt, { user: sourceId }, { $set: { user: targetId } }, session, dryRun, 'doubt.user', counts);
            await safeUpdateMany(Notification, { userId: sourceId }, { $set: { userId: targetId } }, session, dryRun, 'notification.userId', counts);
            await safeUpdateMany(Submission, { user: sourceId }, { $set: { user: targetId } }, session, dryRun, 'submission.user', counts);
            await safeUpdateMany(Contest, { createdBy: sourceId }, { $set: { createdBy: targetId } }, session, dryRun, 'contest.createdBy', counts);
            await safeUpdateMany(Problem, { createdBy: sourceId }, { $set: { createdBy: targetId } }, session, dryRun, 'problem.createdBy', counts);
            await safeUpdateMany(Problem, { approvedBy: sourceId }, { $set: { approvedBy: targetId } }, session, dryRun, 'problem.approvedBy', counts);
            await safeUpdateMany(Problem, { 'editorial.publishedBy': sourceId }, { $set: { 'editorial.publishedBy': targetId } }, session, dryRun, 'problem.editorial.publishedBy', counts);
            await safeUpdateMany(Report, { reportedUserId: sourceId }, { $set: { reportedUserId: targetId } }, session, dryRun, 'report.reportedUserId', counts);
            await safeUpdateMany(Report, { reviewedBy: sourceId }, { $set: { reviewedBy: targetId } }, session, dryRun, 'report.reviewedBy', counts);
            await safeUpdateMany(Setting, { updatedBy: sourceId }, { $set: { updatedBy: targetId } }, session, dryRun, 'setting.updatedBy', counts);
            await safeUpdateMany(Ticket, { createdBy: sourceId }, { $set: { createdBy: targetId } }, session, dryRun, 'ticket.createdBy', counts);
            await safeUpdateMany(Ticket, { assignedTo: sourceId }, { $set: { assignedTo: targetId } }, session, dryRun, 'ticket.assignedTo', counts);
            await safeUpdateMany(TicketMessage, { sender: sourceId }, { $set: { sender: targetId } }, session, dryRun, 'ticketMessage.sender', counts);
            await safeUpdateMany(TicketDecision, { decidedBy: sourceId }, { $set: { decidedBy: targetId } }, session, dryRun, 'ticketDecision.decidedBy', counts);

            const viewedByMatched = await Doubt.countDocuments({ viewedBy: sourceId }).session(session);
            counts['doubt.viewedBy'] = { matched: viewedByMatched, modified: dryRun ? 0 : viewedByMatched };
            if (!dryRun && viewedByMatched > 0) {
                await Doubt.updateMany(
                    { viewedBy: sourceId },
                    { $addToSet: { viewedBy: targetId } },
                    { session }
                );
                await Doubt.updateMany(
                    { viewedBy: sourceId },
                    { $pull: { viewedBy: sourceId } },
                    { session }
                );
            }

            await migrateUniqueByKeys({
                model: ProblemLike,
                userField: 'user',
                keyFields: ['problem'],
                sourceId,
                targetId,
                session,
                dryRun,
                label: 'problemLike.user',
                counts
            });

            await migrateUniqueByKeys({
                model: CommentReaction,
                userField: 'user',
                keyFields: ['comment'],
                sourceId,
                targetId,
                session,
                dryRun,
                label: 'commentReaction.user',
                counts
            });

            await migrateUniqueByKeys({
                model: CommentReport,
                userField: 'reporter',
                keyFields: ['comment'],
                sourceId,
                targetId,
                session,
                dryRun,
                label: 'commentReport.reporter',
                counts
            });

            await migrateUniqueByKeys({
                model: DoubtView,
                userField: 'viewerUser',
                keyFields: ['doubt', 'windowStartAt'],
                sourceId,
                targetId,
                session,
                dryRun,
                label: 'doubtView.viewerUser',
                counts
            });

            await migrateUniqueByKeys({
                model: Report,
                userField: 'reporterId',
                keyFields: ['contentId', 'contentType'],
                sourceId,
                targetId,
                session,
                dryRun,
                label: 'report.reporterId',
                counts
            });

            await migrateUniqueByKeys({
                model: Progress,
                userField: 'user',
                keyFields: ['topic'],
                sourceId,
                targetId,
                session,
                dryRun,
                label: 'progress.user',
                counts,
                onDuplicate: async ({ sourceDoc, targetDoc }) => {
                    mergeProgressDoc(targetDoc, sourceDoc);
                    await targetDoc.save({ session });
                }
            });

            await migrateUniqueByKeys({
                model: ContestParticipant,
                userField: 'userId',
                keyFields: ['contestId'],
                sourceId,
                targetId,
                session,
                dryRun,
                label: 'contestParticipant.userId',
                counts,
                onDuplicate: async ({ sourceDoc, targetDoc }) => {
                    mergeContestParticipantDoc(targetDoc, sourceDoc);
                    await targetDoc.save({ session });
                }
            });

            const sourceProfile = await Profile.findOne({ user: sourceId }).session(session);
            const targetProfile = await Profile.findOne({ user: targetId }).session(session);
            if (!sourceProfile) {
                counts.profile = { matched: 0, moved: 0, merged: 0, deleted: 0 };
            } else if (!targetProfile) {
                counts.profile = { matched: 1, moved: 1, merged: 0, deleted: 0 };
                if (!dryRun) {
                    sourceProfile.user = targetId;
                    await sourceProfile.save({ session });
                }
            } else {
                counts.profile = { matched: 1, moved: 0, merged: 1, deleted: 1 };
                if (!dryRun) {
                    mergeProfileDoc(targetProfile, sourceProfile);
                    await targetProfile.save({ session });
                    await Profile.deleteOne({ _id: sourceProfile._id }, { session });
                }
            }

            const sourceAnalytics = await UserAnalytics.findOne({ user: sourceId }).session(session);
            const targetAnalytics = await UserAnalytics.findOne({ user: targetId }).session(session);
            if (!sourceAnalytics) {
                counts.userAnalytics = { matched: 0, moved: 0, merged: 0, deleted: 0 };
            } else if (!targetAnalytics) {
                counts.userAnalytics = { matched: 1, moved: 1, merged: 0, deleted: 0 };
                if (!dryRun) {
                    sourceAnalytics.user = targetId;
                    await sourceAnalytics.save({ session });
                }
            } else {
                counts.userAnalytics = { matched: 1, moved: 0, merged: 1, deleted: 1 };
                if (!dryRun) {
                    mergeUserAnalyticsDoc(targetAnalytics, sourceAnalytics);
                    await targetAnalytics.save({ session });
                    await UserAnalytics.deleteOne({ _id: sourceAnalytics._id }, { session });
                }
            }

            const sourceUser = await User.findById(sourceId).session(session);
            const targetUser = await User.findById(targetId).session(session);
            if (!sourceUser || !targetUser) {
                throw new Error('Source or target user missing during merge stage.');
            }

            counts.userDocuments = { merged: true };
            if (!dryRun) {
                targetUser.bookmarkedProblems = unionObjectIds(targetUser.bookmarkedProblems, sourceUser.bookmarkedProblems);
                targetUser.savedDoubts = unionObjectIds(targetUser.savedDoubts, sourceUser.savedDoubts);
                targetUser.solvedProblems = unionObjectIds(targetUser.solvedProblems, sourceUser.solvedProblems);

                targetUser.badges = mergeBadges(targetUser.badges, sourceUser.badges);
                targetUser.rating = targetUser.rating || {};
                sourceUser.rating = sourceUser.rating || {};
                targetUser.rating.current = Math.max(Number(targetUser.rating.current || 0), Number(sourceUser.rating.current || 0));
                targetUser.rating.highest = Math.max(Number(targetUser.rating.highest || 0), Number(sourceUser.rating.highest || 0));
                targetUser.rating.history = mergeRatingHistory(targetUser.rating.history, sourceUser.rating.history);

                targetUser.contestStats = targetUser.contestStats || {};
                sourceUser.contestStats = sourceUser.contestStats || {};
                targetUser.contestStats.participated = Number(targetUser.contestStats.participated || 0) + Number(sourceUser.contestStats.participated || 0);
                targetUser.contestStats.totalScore = Number(targetUser.contestStats.totalScore || 0) + Number(sourceUser.contestStats.totalScore || 0);

                const targetBestRank = targetUser.contestStats.bestRank == null ? Number.MAX_SAFE_INTEGER : Number(targetUser.contestStats.bestRank);
                const sourceBestRank = sourceUser.contestStats.bestRank == null ? Number.MAX_SAFE_INTEGER : Number(sourceUser.contestStats.bestRank);
                const bestRank = Math.min(targetBestRank, sourceBestRank);
                targetUser.contestStats.bestRank = bestRank === Number.MAX_SAFE_INTEGER ? null : bestRank;

                targetUser.level = Math.max(Number(targetUser.level || 1), Number(sourceUser.level || 1));
                targetUser.xp = Math.max(Number(targetUser.xp || 0), Number(sourceUser.xp || 0));
                targetUser.finalScore = Math.max(Number(targetUser.finalScore || 0), Number(sourceUser.finalScore || 0));
                targetUser.globalRank = targetUser.globalRank ?? sourceUser.globalRank ?? null;

                await targetUser.save({ session });
            }

            await recomputeSubmissionStats(targetId, session, dryRun, counts);

            counts.sourceUser = {
                deleteRequested: options.deleteSource,
                deleted: false
            };

            if (!dryRun && options.deleteSource) {
                await User.deleteOne({ _id: sourceId }, { session });
                counts.sourceUser.deleted = true;
            }

            if (dryRun) {
                await session.abortTransaction();
            }
        });
    } finally {
        await session.endSession();
        await mongoose.disconnect();
    }

    console.log('----- USER DATA MIGRATION SUMMARY -----');
    console.log(`Mode: ${options.apply ? 'APPLY' : 'DRY_RUN'}`);
    console.log(`From: ${options.fromEmail}`);
    console.log(`To (requested): ${options.toEmail}`);
    console.log(`To (resolved): ${resolvedTargetEmail}`);
    if (fromUser && toUser) {
        console.log(`SourceId: ${fromUser._id}`);
        console.log(`TargetId: ${toUser._id}`);
    }
    Object.entries(counts).forEach(([key, value]) => {
        console.log(`${key}: ${JSON.stringify(value)}`);
    });
    console.log('---------------------------------------');
};

run().catch(async (error) => {
    console.error(`[migrate-user-data] FAIL: ${error.message}`);
    try {
        await mongoose.disconnect();
    } catch (_) {
        // noop
    }
    process.exit(1);
});
