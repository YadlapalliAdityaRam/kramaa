const Report = require('../models/Report');
const User = require('../models/User');
const Doubt = require('../models/Doubt');
const Solution = require('../models/Solution');
const Submission = require('../models/Submission');
const Profile = require('../models/Profile');
const CommentReaction = require('../models/CommentReaction');
const CommentReport = require('../models/CommentReport');
const auditLogger = require('../services/auditLogger');
const Notification = require('../models/Notification');

const TYPE_TO_MODEL = {
    Profile: User,
    Doubt: Doubt,
    Solution: Solution,
    Submission: Submission
};

const AUTO_HIDE_THRESHOLD = 5;
const REPORT_FINAL_STATUSES = new Set(['resolved', 'rejected']);
const ADMIN_ALLOWED_ACTIONS = new Set(['review', 'dismiss', 'mark_safe', 'warn', 'remove_content', 'temp_suspend']);
const SUPER_ADMIN_EXTRA_ACTIONS = new Set(['permanent_ban', 'delete_user']);
const ACTION_TO_DEFAULT_STATUS = {
    review: 'reviewed',
    dismiss: 'rejected',
    mark_safe: 'resolved',
    warn: 'resolved',
    remove_content: 'resolved',
    temp_suspend: 'resolved',
    permanent_ban: 'resolved',
    delete_user: 'resolved'
};

const normalizeRole = (role) => String(role || '').trim().toUpperCase();
const normalizeStatus = (status) => {
    const value = String(status || '').trim().toLowerCase();
    if (!value) return '';
    if (value === 'action_taken') return 'resolved';
    return value;
};

const normalizeAction = (action, role) => {
    const value = String(action || '').trim().toLowerCase();
    if (!value) return '';

    if (value === 'safe' || value === 'resolve') return 'mark_safe';
    if (value === 'suspend') return 'temp_suspend';
    if (value === 'ban') return role === 'SUPER_ADMIN' ? 'permanent_ban' : 'temp_suspend';
    if (value === 'ban_user') return role === 'SUPER_ADMIN' ? 'permanent_ban' : 'temp_suspend';
    if (value === 'remove') return 'remove_content';
    return value;
};

const isValidStatus = (status) => ['pending', 'reviewed', 'resolved', 'rejected'].includes(status);

const isValidStatusTransition = (fromStatus, toStatus, { superAdmin = false } = {}) => {
    if (fromStatus === toStatus) return true;
    if (superAdmin) {
        if (fromStatus === 'pending') return ['reviewed', 'resolved', 'rejected'].includes(toStatus);
        if (fromStatus === 'reviewed') return ['resolved', 'rejected', 'reviewed'].includes(toStatus);
        if (fromStatus === 'resolved' || fromStatus === 'rejected') {
            return ['reviewed', 'resolved', 'rejected'].includes(toStatus);
        }
        return false;
    }
    if (fromStatus === 'pending') return toStatus === 'reviewed';
    if (fromStatus === 'reviewed') return toStatus === 'resolved' || toStatus === 'rejected';
    return false;
};

const canSetPath = (document, pathName) => Boolean(document?.schema?.path(pathName));

const toResponseReport = (reportDoc) => {
    const obj = typeof reportDoc.toObject === 'function' ? reportDoc.toObject() : reportDoc;
    return {
        ...obj,
        status: normalizeStatus(obj?.status)
    };
};

const notifyUser = async (userId, title, message) => {
    if (!userId) return;
    try {
        await Notification.create({
            userId,
            type: 'system',
            title,
            message
        });
    } catch (error) {
        console.error('Report notification error:', error.message);
    }
};

const loadReportedContent = async (report) => {
    const Model = TYPE_TO_MODEL[report.contentType];
    if (!Model) return null;
    return Model.findById(report.contentId);
};

const hideReportedContent = async (report) => {
    const content = await loadReportedContent(report);
    if (!content) return false;

    if (report.contentType === 'Profile') {
        if (canSetPath(content, 'accountStatus')) {
            content.accountStatus = 'Suspended';
        }
        if (canSetPath(content, 'sessionInvalidatedAt')) {
            content.sessionInvalidatedAt = new Date();
        }
    } else if (canSetPath(content, 'isHidden')) {
        content.isHidden = true;
    }

    await content.save();
    return true;
};

const collectDoubtTreeIds = async (rootId) => {
    const visited = new Set();
    const collected = [];
    let frontier = [String(rootId)];

    while (frontier.length > 0) {
        const batch = frontier.filter((id) => id && !visited.has(String(id)));
        frontier = [];
        if (!batch.length) break;

        batch.forEach((id) => {
            const normalized = String(id);
            visited.add(normalized);
            collected.push(normalized);
        });

        const children = await Doubt.find({ parentComment: { $in: batch } }).select('_id');
        if (children.length > 0) {
            frontier = children.map((child) => String(child._id));
        }
    }

    return collected;
};

const hardDeleteDoubtContent = async (doubtId, currentReportId = null) => {
    const root = await Doubt.findById(doubtId).select('_id parentComment');
    if (!root) return { success: false, deletedCount: 0 };

    const subtreeIds = await collectDoubtTreeIds(root._id);
    if (!subtreeIds.length) return { success: false, deletedCount: 0 };

    const reportCleanupQuery = {
        contentType: 'Doubt',
        contentId: { $in: subtreeIds }
    };
    if (currentReportId) {
        reportCleanupQuery._id = { $ne: currentReportId };
    }

    await Promise.all([
        CommentReaction.deleteMany({ comment: { $in: subtreeIds } }),
        CommentReport.deleteMany({ comment: { $in: subtreeIds } }),
        User.updateMany(
            { savedDoubts: { $in: subtreeIds } },
            { $pull: { savedDoubts: { $in: subtreeIds } } }
        ),
        Report.deleteMany(reportCleanupQuery),
        Doubt.deleteMany({ _id: { $in: subtreeIds } })
    ]);

    if (root.parentComment) {
        await Doubt.updateOne({ _id: root.parentComment }, { $inc: { repliesCount: -1 } });
        await Doubt.updateOne(
            { _id: root.parentComment, repliesCount: { $lt: 0 } },
            { $set: { repliesCount: 0 } }
        );
    }

    return { success: true, deletedCount: subtreeIds.length };
};

const hardDeleteGenericContent = async (contentType, contentId, currentReportId = null) => {
    const Model = TYPE_TO_MODEL[contentType];
    if (!Model) return { success: false, deletedCount: 0 };

    const deletionResult = await Model.deleteOne({ _id: contentId });
    if (deletionResult?.deletedCount > 0) {
        const reportCleanupQuery = { contentType, contentId };
        if (currentReportId) {
            reportCleanupQuery._id = { $ne: currentReportId };
        }
        await Report.deleteMany(reportCleanupQuery);
    }

    return { success: deletionResult?.deletedCount > 0, deletedCount: deletionResult?.deletedCount || 0 };
};

const hardDeleteReportedContent = async (report) => {
    if (!report?.contentId || !report?.contentType) return { success: false, deletedCount: 0 };

    if (report.contentType === 'Doubt') {
        return hardDeleteDoubtContent(report.contentId, report._id);
    }

    if (report.contentType === 'Solution' || report.contentType === 'Submission') {
        return hardDeleteGenericContent(report.contentType, report.contentId, report._id);
    }

    return { success: false, deletedCount: 0 };
};

const deleteUserAndAssociatedData = async (userId, currentReportId = null) => {
    if (!userId) return false;

    await Promise.all([
        User.findByIdAndDelete(userId),
        Profile.deleteOne({ user: userId }),
        Notification.deleteMany({ userId }),
        CommentReaction.deleteMany({ user: userId }),
        CommentReport.deleteMany({ reporter: userId }),
        Report.deleteMany({
            _id: currentReportId ? { $ne: currentReportId } : { $exists: true },
            $or: [{ reporterId: userId }, { reportedUserId: userId }]
        })
    ]);

    return true;
};

const suspendUser = async (reportedUserId) => {
    if (!reportedUserId) return null;
    const user = await User.findById(reportedUserId);
    if (!user) return null;
    user.accountStatus = 'Suspended';
    user.sessionInvalidatedAt = new Date();
    await user.save();
    return user;
};

exports.createReport = async (req, res) => {
    try {
        const { contentId, contentType, reportedUserId, reason, description } = req.body;
        const reporterId = req.user._id;

        if (!TYPE_TO_MODEL[contentType]) {
            return res.status(400).json({ success: false, message: 'Invalid content type' });
        }

        const Model = TYPE_TO_MODEL[contentType];
        const content = await Model.findById(contentId);
        if (!content) {
            return res.status(404).json({ success: false, message: 'Content not found' });
        }

        const report = new Report({
            reporterId,
            reportedUserId,
            contentId,
            contentType,
            reason,
            description
        });

        await report.save();

        if (canSetPath(content, 'reportCount')) {
            content.reportCount = (content.reportCount || 0) + 1;
        }

        if (canSetPath(content, 'isHidden') && (content.reportCount || 0) >= AUTO_HIDE_THRESHOLD && !content.isHidden) {
            content.isHidden = true;
        }
        await content.save();

        const admins = await User.find({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } }).select('_id');
        if (admins.length > 0) {
            await Notification.insertMany(
                admins.map((admin) => ({
                    userId: admin._id,
                    type: 'system',
                    title: 'New Report Submitted',
                    message: `${contentType} was reported for "${reason}".`,
                    link: '/admin/reports'
                }))
            );
        }

        return res.status(201).json({ success: true, message: 'Report submitted successfully' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'You have already reported this content' });
        }
        console.error('Create Report Error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getReports = async (req, res) => {
    try {
        const { status, type, page = 1, limit = 20 } = req.query;
        const query = {};

        const normalizedStatus = normalizeStatus(status);
        if (status && status !== 'All') {
            if (normalizedStatus === 'resolved') {
                query.status = { $in: ['resolved', 'action_taken'] };
            } else {
                query.status = normalizedStatus;
            }
        }

        if (type && type !== 'All') {
            query.contentType = type;
        }

        const pageNumber = Math.max(1, parseInt(page, 10) || 1);
        const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        const skip = (pageNumber - 1) * limitNumber;

        const reports = await Report.find(query)
            .populate('reporterId', 'username avatar')
            .populate('reportedUserId', 'username avatar')
            .populate('reviewedBy', 'username role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber);

        const total = await Report.countDocuments(query);

        return res.json({
            success: true,
            reports: reports.map(toResponseReport),
            pagination: {
                page: pageNumber,
                pages: Math.ceil(total / limitNumber),
                total
            }
        });
    } catch (error) {
        console.error('Get Reports Error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateReportStatus = async (req, res) => {
    try {
        const userRole = normalizeRole(req.user?.role);
        const superAdmin = userRole === 'SUPER_ADMIN';
        const allowedActions = new Set([
            ...ADMIN_ALLOWED_ACTIONS,
            ...(superAdmin ? Array.from(SUPER_ADMIN_EXTRA_ACTIONS) : [])
        ]);

        const report = await Report.findById(req.params.id)
            .populate('reportedUserId')
            .populate('reporterId');

        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        const currentStatus = normalizeStatus(report.status || 'pending');
        const requestedAction = normalizeAction(req.body?.action, userRole);
        const explicitStatus = normalizeStatus(req.body?.status);
        const inferredStatus = ACTION_TO_DEFAULT_STATUS[requestedAction] || currentStatus;
        const nextStatus = explicitStatus || inferredStatus;
        const adminNotes = String(req.body?.adminNotes || '').trim();

        if (!requestedAction || !allowedActions.has(requestedAction)) {
            return res.status(403).json({ success: false, message: 'You are not allowed to perform this moderation action.' });
        }

        if (!isValidStatus(nextStatus)) {
            return res.status(400).json({ success: false, message: 'Invalid report status.' });
        }

        const defaultStatusForAction = ACTION_TO_DEFAULT_STATUS[requestedAction];
        if (defaultStatusForAction && nextStatus !== defaultStatusForAction) {
            return res.status(400).json({
                success: false,
                message: `Action "${requestedAction}" requires status "${defaultStatusForAction}".`
            });
        }

        if (REPORT_FINAL_STATUSES.has(currentStatus) && !superAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Report is already in a final state.'
            });
        }

        if (!isValidStatusTransition(currentStatus, nextStatus, { superAdmin })) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status transition. Follow pending -> reviewed -> resolved/rejected.'
            });
        }

        if ((requestedAction === 'permanent_ban' || requestedAction === 'delete_user') && !superAdmin) {
            return res.status(403).json({ success: false, message: 'Only Super Admin can perform permanent actions.' });
        }

        let actionMetadata = {};

        if (requestedAction === 'remove_content') {
            if (superAdmin && report.contentType !== 'Profile') {
                const hardDeleteResult = await hardDeleteReportedContent(report);
                actionMetadata = {
                    deleteMode: 'hard_delete',
                    deletedCount: hardDeleteResult.deletedCount || 0,
                    hardDeleteSuccess: Boolean(hardDeleteResult.success)
                };
            } else {
                const hidden = await hideReportedContent(report);
                actionMetadata = {
                    deleteMode: 'soft_hide',
                    hidden: Boolean(hidden)
                };
            }

            await notifyUser(
                report.reportedUserId?._id,
                'Content Removed',
                superAdmin && report.contentType !== 'Profile'
                    ? `Your ${report.contentType} was permanently removed by Super Admin after review.`
                    : `Your ${report.contentType} was removed by moderators after review.`
            );
        } else if (requestedAction === 'warn') {
            await notifyUser(
                report.reportedUserId?._id,
                'Moderator Warning',
                `You received a warning related to: ${report.reason}. Please follow community guidelines.`
            );
        } else if (requestedAction === 'temp_suspend') {
            const suspended = await suspendUser(report.reportedUserId?._id);
            if (suspended) {
                await notifyUser(
                    suspended._id,
                    'Account Suspended',
                    'Your account has been temporarily suspended by moderators.'
                );
            }
        } else if (requestedAction === 'permanent_ban') {
            const suspended = await suspendUser(report.reportedUserId?._id);
            if (suspended) {
                await notifyUser(
                    suspended._id,
                    'Account Banned',
                    'Your account has been permanently banned by platform administration.'
                );
            }
        } else if (requestedAction === 'delete_user' && report.reportedUserId?._id) {
            const removed = await deleteUserAndAssociatedData(report.reportedUserId._id, report._id);
            actionMetadata = {
                userDeleted: Boolean(removed)
            };
        }

        report.status = nextStatus;
        report.actionTaken = requestedAction;
        report.reviewedBy = req.user._id;
        report.reviewedAt = new Date();
        report.updatedAt = new Date();
        if (adminNotes) {
            report.adminNotes = adminNotes;
        }
        await report.save();

        await auditLogger.log(
            req.user._id,
            'REPORT_MODERATION_ACTION',
            'REPORT',
            {
                reportId: report._id,
                contentType: report.contentType,
                contentId: report.contentId,
                action: requestedAction,
                statusFrom: currentStatus,
                statusTo: nextStatus,
                reportedUserId: report.reportedUserId?._id || null,
                adminNotes,
                ...actionMetadata
            },
            req.ip
        );

        return res.json({
            success: true,
            message: 'Report updated successfully',
            report: toResponseReport(report)
        });
    } catch (error) {
        console.error('Update Report Error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
