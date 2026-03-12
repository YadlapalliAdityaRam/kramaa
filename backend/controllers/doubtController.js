const Doubt = require('../models/Doubt');
const DoubtView = require('../models/DoubtView');
const CommentReaction = require('../models/CommentReaction');
const CommentReport = require('../models/CommentReport');
const Setting = require('../models/Setting');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const { recordActivity } = require('../services/social/activityService');

// ═══════ HELPERS ═══════

// Bad word filter
const BAD_WORDS = [
    'fuck', 'shit', 'ass', 'bitch', 'damn', 'bastard', 'dick', 'pussy',
    'crap', 'hell', 'idiot', 'stupid', 'dumb', 'retard', 'nigger', 'faggot',
    'whore', 'slut', 'cunt', 'piss', 'cock', 'motherfucker', 'bullshit'
];

const containsBadWords = (text) => {
    const lower = text.toLowerCase();
    return BAD_WORDS.some(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(lower);
    });
};

// Sanitize HTML to prevent XSS
const sanitizeInput = (text) => {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

const normalizeImageUrl = (rawUrl) => {
    if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;

    let url = rawUrl.trim().replace(/\\/g, '/');
    if (!url) return null;

    url = url.replace(/^\.\/+/, '');
    url = url.replace(/^public\/uploads\//i, '/uploads/');
    url = url.replace(/^\/public\/uploads\//i, '/uploads/');
    if (/^uploads\//i.test(url)) url = `/${url}`;

    const publicBackendBaseUrl = String(
        process.env.PUBLIC_BACKEND_URL
        || process.env.BACKEND_PUBLIC_URL
        || process.env.SERVER_PUBLIC_URL
        || ''
    ).trim().replace(/\/+$/, '');

    if (url.startsWith('/uploads/') && /^https?:\/\//i.test(publicBackendBaseUrl)) {
        return `${publicBackendBaseUrl}${url}`;
    }

    return url;
};

// Check if discussions are enabled globally
const isDiscussionEnabled = async () => {
    const setting = await Setting.findOne({ key: 'discussionsEnabled' });
    return setting ? setting.value : true;
};

// Rate limiter store (in-memory, resets on server restart)
const rateLimitStore = {};
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5;
const VIEW_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

const checkRateLimit = (userId) => {
    const now = Date.now();
    const userKey = userId.toString();

    if (!rateLimitStore[userKey]) {
        rateLimitStore[userKey] = [];
    }

    // Remove entries older than the window
    rateLimitStore[userKey] = rateLimitStore[userKey].filter(ts => now - ts < RATE_LIMIT_WINDOW);

    if (rateLimitStore[userKey].length >= RATE_LIMIT_MAX) {
        return false; // Rate limited
    }

    rateLimitStore[userKey].push(now);
    return true;
};

const getViewWindowStart = (timestampMs = Date.now()) => {
    const windowStartMs = Math.floor(timestampMs / VIEW_WINDOW_MS) * VIEW_WINDOW_MS;
    return new Date(windowStartMs);
};

const getSavedDoubtIdSet = async (req, requesterId) => {
    if (!requesterId) return new Set();

    // Reuse authenticated user from middleware when available to avoid extra DB query.
    if (req.user?._id?.toString() === requesterId && Array.isArray(req.user.savedDoubts)) {
        return new Set(req.user.savedDoubts.map(id => id.toString()));
    }

    const userDoc = await User.findById(requesterId).select('savedDoubts');
    if (!userDoc || !Array.isArray(userDoc.savedDoubts)) return new Set();
    return new Set(userDoc.savedDoubts.map(id => id.toString()));
};

// ═══════ ENDPOINTS ═══════

// GET /api/doubts/:problemId — paginated top-level comments
// GET /api/doubts/community — paginated general community threads
exports.getCommunityThreads = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const sort = req.query.sort || 'latest'; // latest/recent, popular, mostReplied
        const category = req.query.category; // Optional filter
        const tag = req.query.tag; // Optional filter

        const enabled = await isDiscussionEnabled();

        // Build sort option
        let sortOption = {};
        switch (sort) {
            case 'oldest': sortOption = { createdAt: 1 }; break;
            case 'popular': sortOption = { likesCount: -1, createdAt: -1 }; break;
            case 'mostReplied': sortOption = { repliesCount: -1, createdAt: -1 }; break;
            case 'recent':
            case 'latest':
            default: sortOption = { createdAt: -1 };
        }

        // Filter for general threads (must not have a problem attached)
        let query = {
            parentComment: null,
            isDeleted: false,
            problem: null
        };

        if (category && category !== 'All') {
            query.category = category;
        }
        if (tag) {
            query.tags = tag;
        }

        const total = await Doubt.countDocuments(query);
        const threads = await Doubt.find(query)
            .populate('user', 'username avatar')
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(limit);

        const requesterId = req.user?._id?.toString() || req.query.userId;
        const savedDoubtIds = await getSavedDoubtIdSet(req, requesterId);

        // Check user likes and dislikes
        let userLikes = [];
        let userDislikes = [];
        if (requesterId) {
            const reactions = await CommentReaction.find({
                comment: { $in: threads.map(t => t._id) },
                user: requesterId
            });
            userLikes = reactions.filter(r => r.type === 'like').map(r => r.comment.toString());
            userDislikes = reactions.filter(r => r.type === 'dislike').map(r => r.comment.toString());
        }

        const processed = threads.map(t => {
            const obj = t.toObject();
            obj.imageUrl = normalizeImageUrl(obj.imageUrl);
            obj.hasLiked = userLikes.includes(t._id.toString());
            obj.hasDisliked = userDislikes.includes(t._id.toString());
            obj.isSaved = savedDoubtIds.has(t._id.toString());
            if (obj.isDeleted) {
                obj.content = 'This thread has been deleted';
                obj.title = undefined;
                obj.imageUrl = undefined;
            }
            return obj;
        });

        res.json({
            success: true,
            discussionsEnabled: enabled,
            threads: processed,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: page * limit < total
            }
        });
    } catch (error) {
        console.error('getCommunityThreads error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/doubts/my-posts — get authenticated user's community threads
exports.getMyCommunityPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 12, 50);
        const sort = req.query.sort || 'latest';

        let sortOption = {};
        switch (sort) {
            case 'oldest': sortOption = { createdAt: 1 }; break;
            case 'popular': sortOption = { likesCount: -1, createdAt: -1 }; break;
            case 'mostReplied': sortOption = { repliesCount: -1, createdAt: -1 }; break;
            case 'recent':
            case 'latest':
            default: sortOption = { createdAt: -1 };
        }

        const query = {
            user: req.user.id,
            parentComment: null,
            problem: null,
            isDeleted: false
        };

        const [total, threads] = await Promise.all([
            Doubt.countDocuments(query),
            Doubt.find(query)
                .populate('user', 'username avatar')
                .sort(sortOption)
                .skip((page - 1) * limit)
                .limit(limit)
        ]);

        const requesterId = req.user?._id?.toString() || req.user?.id?.toString();
        const reactions = await CommentReaction.find({
            comment: { $in: threads.map(t => t._id) },
            user: requesterId
        });
        const userLikes = reactions.filter(r => r.type === 'like').map(r => r.comment.toString());
        const userDislikes = reactions.filter(r => r.type === 'dislike').map(r => r.comment.toString());
        const savedDoubtIds = await getSavedDoubtIdSet(req, requesterId);

        const processed = threads.map((thread) => {
            const obj = thread.toObject();
            obj.imageUrl = normalizeImageUrl(obj.imageUrl);
            obj.hasLiked = userLikes.includes(thread._id.toString());
            obj.hasDisliked = userDislikes.includes(thread._id.toString());
            obj.isSaved = savedDoubtIds.has(thread._id.toString());
            return obj;
        });

        return res.json({
            success: true,
            threads: processed,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: page * limit < total
            }
        });
    } catch (error) {
        console.error('getMyCommunityPosts error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/doubts/saved — get authenticated user's saved community threads
exports.getSavedCommunityThreads = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('savedDoubts');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const savedIds = (user.savedDoubts || []).map(id => id.toString());
        if (savedIds.length === 0) {
            return res.json({ success: true, threads: [] });
        }

        const threads = await Doubt.find({
            _id: { $in: savedIds },
            parentComment: null,
            problem: null,
            isDeleted: false,
            isHidden: { $ne: true }
        })
            .populate('user', 'username avatar')
            .sort({ createdAt: -1 });

        const reactions = await CommentReaction.find({
            comment: { $in: threads.map(t => t._id) },
            user: req.user.id
        });
        const userLikes = reactions.filter(r => r.type === 'like').map(r => r.comment.toString());
        const userDislikes = reactions.filter(r => r.type === 'dislike').map(r => r.comment.toString());

        const processed = threads.map((thread) => {
            const obj = thread.toObject();
            obj.imageUrl = normalizeImageUrl(obj.imageUrl);
            obj.hasLiked = userLikes.includes(thread._id.toString());
            obj.hasDisliked = userDislikes.includes(thread._id.toString());
            obj.isSaved = true;
            return obj;
        });

        return res.json({ success: true, threads: processed });
    } catch (error) {
        console.error('getSavedCommunityThreads error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/doubts/:doubtId/save — toggle save/unsave for a community thread
exports.toggleSaveDoubt = async (req, res) => {
    try {
        const { doubtId } = req.params;

        const thread = await Doubt.findOne({
            _id: doubtId,
            parentComment: null,
            problem: null,
            isDeleted: false,
            isHidden: { $ne: true }
        }).select('_id');

        if (!thread) {
            return res.status(404).json({ success: false, message: 'Community thread not found' });
        }

        const user = await User.findById(req.user.id).select('savedDoubts');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!Array.isArray(user.savedDoubts)) {
            user.savedDoubts = [];
        }

        const index = user.savedDoubts.findIndex(id => id.toString() === doubtId);
        let saved = false;
        if (index !== -1) {
            user.savedDoubts.splice(index, 1);
            saved = false;
        } else {
            user.savedDoubts.push(thread._id);
            saved = true;
        }

        await user.save();

        return res.json({
            success: true,
            saved,
            savedDoubts: user.savedDoubts
        });
    } catch (error) {
        console.error('toggleSaveDoubt error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/doubts/:problemId — paginated top-level comments for a problem
exports.getDoubts = async (req, res) => {
    try {
        const { problemId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const sort = req.query.sort || 'recent';

        if (!problemId) {
            return res.status(400).json({ success: false, message: 'Problem ID is required' });
        }

        const enabled = await isDiscussionEnabled();

        let sortOption = {};
        switch (sort) {
            case 'oldest': sortOption = { createdAt: 1 }; break;
            case 'mostLiked': sortOption = { likesCount: -1, createdAt: -1 }; break;
            case 'mostReplied': sortOption = { repliesCount: -1, createdAt: -1 }; break;
            default: sortOption = { createdAt: -1 };
        }

        // Problem specific doubts
        const query = { problem: problemId, parentComment: null };

        const total = await Doubt.countDocuments(query);
        const doubts = await Doubt.find(query)
            .populate('user', 'username avatar')
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(limit);

        const requesterId = req.user?._id?.toString() || req.query.userId;

        let userLikes = [];
        let userDislikes = [];
        if (requesterId) {
            const reactions = await CommentReaction.find({
                comment: { $in: doubts.map(d => d._id) },
                user: requesterId
            });
            userLikes = reactions.filter(r => r.type === 'like').map(r => r.comment.toString());
            userDislikes = reactions.filter(r => r.type === 'dislike').map(r => r.comment.toString());
        }

        const processed = doubts.map(d => {
            const obj = d.toObject();
            obj.imageUrl = normalizeImageUrl(obj.imageUrl);
            obj.hasLiked = userLikes.includes(d._id.toString());
            obj.hasDisliked = userDislikes.includes(d._id.toString());
            if (obj.isDeleted) {
                obj.content = 'This comment has been deleted';
                obj.imageUrl = undefined;
            }
            return obj;
        });

        res.json({
            success: true,
            discussionsEnabled: enabled,
            doubts: processed,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: page * limit < total
            }
        });
    } catch (error) {
        console.error('getDoubts error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/doubts/:commentId/replies — paginated replies for a comment
exports.getReplies = async (req, res) => {
    try {
        const { commentId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const query = { parentComment: commentId };
        const total = await Doubt.countDocuments(query);

        const replies = await Doubt.find(query)
            .populate('user', 'username avatar')
            .sort({ createdAt: 1 }) // oldest first for replies
            .skip((page - 1) * limit)
            .limit(limit);

        const requesterId = req.user?._id?.toString() || req.query.userId;

        // Check user likes/dislikes
        let userLikes = [];
        let userDislikes = [];
        if (requesterId) {
            const reactions = await CommentReaction.find({
                comment: { $in: replies.map(r => r._id) },
                user: requesterId
            });
            userLikes = reactions.filter(r => r.type === 'like').map(r => r.comment.toString());
            userDislikes = reactions.filter(r => r.type === 'dislike').map(r => r.comment.toString());
        }

        const processed = replies.map(r => {
            const obj = r.toObject();
            obj.imageUrl = normalizeImageUrl(obj.imageUrl);
            obj.hasLiked = userLikes.includes(r._id.toString());
            obj.hasDisliked = userDislikes.includes(r._id.toString());
            if (obj.isDeleted) {
                obj.content = 'This comment has been deleted';
                obj.imageUrl = undefined;
            }
            return obj;
        });

        res.json({
            success: true,
            replies: processed,
            pagination: {
                page, limit, total,
                totalPages: Math.ceil(total / limit),
                hasMore: page * limit < total
            }
        });
    } catch (error) {
        console.error('getReplies error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/doubts/:problemId — create a comment or reply
// POST /api/doubts/create — create a comment/thread (Unified)
exports.createDoubt = async (req, res) => {
    try {
        // Support both body and params for problemId
        const problemId = req.params.problemId || req.body.problemId;
        const { content, parentCommentId, title, category, tags } = req.body;

        // Validation
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Content is required' });
        }
        if (content.length > 5000) {
            return res.status(400).json({ success: false, message: 'Content too long (max 5000 chars)' });
        }

        // Check discussions enabled
        const enabled = await isDiscussionEnabled();
        if (!enabled) {
            return res.status(403).json({ success: false, message: 'Discussions are currently disabled by admin' });
        }

        // Rate limiting
        if (!checkRateLimit(req.user.id)) {
            return res.status(429).json({ success: false, message: 'Too many posts. Please wait a minute before posting again.' });
        }

        // Bad word filter
        if (containsBadWords(content) || (title && containsBadWords(title))) {
            return res.status(400).json({
                success: false,
                message: 'Your post contains inappropriate language.'
            });
        }

        // Sanitize
        const sanitizedContent = sanitizeInput(content.trim());
        const sanitizedTitle = title ? sanitizeInput(title.trim()) : undefined;

        // Handle reply logic
        let depth = 0;
        let parentComment = null;
        let parentNode = null;
        let threadRootNode = null;
        if (parentCommentId) {
            parentNode = await Doubt.findById(parentCommentId).select('_id user problem parentComment depth');
            if (!parentNode) {
                return res.status(404).json({ success: false, message: 'Parent comment not found' });
            }
            if (parentNode.depth >= 2) {
                parentComment = parentNode._id;
                depth = 2;
            } else {
                parentComment = parentNode._id;
                depth = parentNode.depth + 1;
            }

            // Resolve root thread (max 2-level depth in current schema)
            if (parentNode.parentComment) {
                threadRootNode = await Doubt.findById(parentNode.parentComment).select('_id user problem');
            } else {
                threadRootNode = parentNode;
            }

            // Increment parent's repliesCount
            await Doubt.findByIdAndUpdate(parentCommentId, { $inc: { repliesCount: 1 } });
        }

        // Handle image upload URL
        const imageUrl = req.file ? `/uploads/doubts/${req.file.filename}` : null;

        const newDoubt = await Doubt.create({
            problem: problemId || undefined,
            user: req.user.id,
            content: sanitizedContent,
            title: sanitizedTitle,
            category: category || (problemId ? 'Problem' : 'General'),
            tags: tags || [],
            imageUrl,
            parentComment,
            depth
        });

        const populated = await Doubt.findById(newDoubt._id).populate('user', 'username avatar');

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            if (problemId) {
                // Emit to problem room
                io.emit('new_comment', {
                    problemId,
                    comment: { ...populated.toObject(), hasLiked: false }
                });
            } else {
                // Emit to global community
                io.emit('new_thread', {
                    thread: { ...populated.toObject(), hasLiked: false, hasDisliked: false }
                });
            }
        }

        try {
            await recordActivity(req, {
                userId: req.user.id,
                activityType: 'discussion_created',
                problemId: problemId || null,
                doubtId: newDoubt._id,
                metadata: {
                    category: category || (problemId ? 'Problem' : 'General'),
                    title: sanitizedTitle || '',
                    threadLink: problemId
                        ? `/coding-platform/${problemId}`
                        : `/community?threadId=${newDoubt._id}`
                },
                dedupeKey: `discussion:${newDoubt._id}`,
                dedupeWindowMinutes: 60 * 24
            });
        } catch (activityError) {
            console.error('Activity event create failed (discussion_created):', activityError.message);
        }

        // Notify owner when someone comments/replies on their post/comment.
        if (parentNode?.user && String(parentNode.user) !== String(req.user.id)) {
            const actorName = req.user.username || 'Someone';
            const isDirectCommentOnPost = parentNode.depth === 0;
            const targetThreadId = threadRootNode?._id || parentNode._id;
            const link = parentNode.problem
                ? `/coding-platform/${parentNode.problem}`
                : `/community?threadId=${targetThreadId}`;

            try {
                await notificationService.createNotification(req, parentNode.user, {
                    type: 'reply',
                    title: isDirectCommentOnPost ? 'New Comment on Your Post' : 'New Reply to Your Comment',
                    message: isDirectCommentOnPost
                        ? `${actorName} commented on your post.`
                        : `${actorName} replied to your comment.`,
                    link,
                    icon: '💬'
                });
            } catch (notifErr) {
                console.error('Comment notification failed:', notifErr.message);
            }
        }

        // If reply is nested, also notify thread owner when different from parent owner.
        if (
            parentNode
            && threadRootNode?.user
            && String(threadRootNode.user) !== String(req.user.id)
            && String(threadRootNode.user) !== String(parentNode.user)
        ) {
            const actorName = req.user.username || 'Someone';
            const link = threadRootNode.problem
                ? `/coding-platform/${threadRootNode.problem}`
                : `/community?threadId=${threadRootNode._id}`;

            try {
                await notificationService.createNotification(req, threadRootNode.user, {
                    type: 'reply',
                    title: 'New Activity on Your Post',
                    message: `${actorName} commented in your post thread.`,
                    link,
                    icon: '💬'
                });
            } catch (notifErr) {
                console.error('Thread owner notification failed:', notifErr.message);
            }
        }

        res.status(201).json({ success: true, doubt: { ...populated.toObject(), hasLiked: false, hasDisliked: false } });
    } catch (error) {
        console.error('createDoubt error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/doubts/:doubtId — edit a comment (author only)
exports.editDoubt = async (req, res) => {
    try {
        const { doubtId } = req.params;
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Content is required' });
        }
        if (content.length > 2000) {
            return res.status(400).json({ success: false, message: 'Content too long (max 2000 chars)' });
        }

        const doubt = await Doubt.findById(doubtId);
        if (!doubt) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }
        if (doubt.isDeleted) {
            return res.status(400).json({ success: false, message: 'Cannot edit a deleted comment' });
        }

        // Only author can edit
        if (doubt.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Only the author can edit this comment' });
        }

        // Bad word filter
        if (containsBadWords(content)) {
            return res.status(400).json({
                success: false,
                message: 'Your message contains inappropriate language.'
            });
        }

        doubt.content = sanitizeInput(content.trim());
        doubt.isEdited = true;
        doubt.updatedAt = new Date();
        await doubt.save();

        const populated = await Doubt.findById(doubt._id).populate('user', 'username avatar');

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('edit_comment', { commentId: doubtId, comment: populated.toObject() });
        }

        res.json({ success: true, doubt: populated });
    } catch (error) {
        console.error('editDoubt error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/doubts/:doubtId — soft delete (author or admin)
exports.deleteDoubt = async (req, res) => {
    try {
        const { doubtId } = req.params;

        const doubt = await Doubt.findById(doubtId);
        if (!doubt) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        const isAuthor = doubt.user.toString() === req.user.id;
        const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
        }

        // Soft delete
        doubt.isDeleted = true;
        doubt.content = 'This comment has been deleted';
        await doubt.save();

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('delete_comment', { commentId: doubtId });
        }

        res.json({ success: true, message: 'Comment deleted' });
    } catch (error) {
        console.error('deleteDoubt error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/doubts/:doubtId/like — toggle reaction (like/dislike)
exports.toggleLikeDoubt = async (req, res) => {
    try {
        const { doubtId } = req.params;
        const userId = req.user.id;
        const type = req.body.type || 'like'; // Default to like if not specified

        if (type !== 'like' && type !== 'dislike') {
            return res.status(400).json({ success: false, message: 'Invalid reaction type' });
        }

        const doubt = await Doubt.findById(doubtId).populate('user');
        if (!doubt) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        const existing = await CommentReaction.findOne({ comment: doubtId, user: userId });

        if (existing) {
            if (existing.type === type) {
                // Remove reaction completely if clicking the same one again
                await existing.deleteOne();
                if (type === 'like') doubt.likesCount = Math.max(0, doubt.likesCount - 1);
                else doubt.dislikesCount = Math.max(0, doubt.dislikesCount - 1);

                await doubt.save();
                return res.json({
                    success: true,
                    likesCount: doubt.likesCount,
                    dislikesCount: doubt.dislikesCount,
                    hasLiked: false,
                    hasDisliked: false
                });
            } else {
                // Switch reaction
                existing.type = type;
                await existing.save();

                if (type === 'like') {
                    doubt.dislikesCount = Math.max(0, doubt.dislikesCount - 1);
                    doubt.likesCount += 1;
                } else {
                    doubt.likesCount = Math.max(0, doubt.likesCount - 1);
                    doubt.dislikesCount += 1;
                }
                await doubt.save();
                return res.json({
                    success: true,
                    likesCount: doubt.likesCount,
                    dislikesCount: doubt.dislikesCount,
                    hasLiked: type === 'like',
                    hasDisliked: type === 'dislike'
                });
            }
        } else {
            // Add new reaction
            await CommentReaction.create({ comment: doubtId, user: userId, type });
            if (type === 'like') doubt.likesCount += 1;
            else doubt.dislikesCount += 1;

            await doubt.save();

            // Create notification for positive reaction only
            if (type === 'like' && doubt.user && doubt.user._id.toString() !== userId) {
                try {
                    const Notification = require('../models/Notification');
                    await Notification.create({
                        userId: doubt.user._id,
                        type: 'like',
                        title: 'New Like',
                        message: `${req.user.username || 'Someone'} liked your ${doubt.parentComment ? 'reply' : 'post'}`,
                        link: doubt.problem ? `/problems/${doubt.problem}#discussions` : '/community',
                        icon: '❤️'
                    });
                } catch (notifErr) {
                    console.error('Notification creation failed:', notifErr.message);
                }
            }

            return res.json({
                success: true,
                likesCount: doubt.likesCount,
                dislikesCount: doubt.dislikesCount,
                hasLiked: type === 'like',
                hasDisliked: type === 'dislike'
            });
        }
    } catch (error) {
        console.error('toggleLikeDoubt error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/doubts/:doubtId/report — report a comment
exports.reportDoubt = async (req, res) => {
    try {
        const { doubtId } = req.params;
        const { reason, details } = req.body;

        const doubt = await Doubt.findById(doubtId);
        if (!doubt) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        // Check if already reported by this user
        const existing = await CommentReport.findOne({ comment: doubtId, reporter: req.user.id });
        if (existing) {
            return res.status(400).json({ success: false, message: 'You have already reported this comment' });
        }

        await CommentReport.create({
            comment: doubtId,
            reporter: req.user.id,
            reason: reason || 'inappropriate',
            details: details ? sanitizeInput(details.trim()) : undefined
        });

        res.json({ success: true, message: 'Comment reported. Our team will review it shortly.' });
    } catch (error) {
        console.error('reportDoubt error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/doubts/admin/reported — admin: get reported comments
exports.getReportedDoubts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status || 'pending';

        const query = { status };
        const total = await CommentReport.countDocuments(query);

        const reports = await CommentReport.find(query)
            .populate({
                path: 'comment',
                populate: { path: 'user', select: 'username avatar' }
            })
            .populate('reporter', 'username')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            success: true,
            reports,
            pagination: {
                page, limit, total,
                totalPages: Math.ceil(total / limit),
                hasMore: page * limit < total
            }
        });
    } catch (error) {
        console.error('getReportedDoubts error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/doubts/admin/:doubtId/permanent — admin: hard delete
exports.permanentDeleteDoubt = async (req, res) => {
    try {
        const { doubtId } = req.params;

        const doubt = await Doubt.findById(doubtId);
        if (!doubt) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        // Delete all reactions and reports for this comment
        await CommentReaction.deleteMany({ comment: doubtId });
        await CommentReport.deleteMany({ comment: doubtId });

        // Delete all replies (recursive)
        const deleteReplies = async (parentId) => {
            const replies = await Doubt.find({ parentComment: parentId });
            for (const reply of replies) {
                await deleteReplies(reply._id);
                await CommentReaction.deleteMany({ comment: reply._id });
                await CommentReport.deleteMany({ comment: reply._id });
                await reply.deleteOne();
            }
        };
        await deleteReplies(doubtId);

        // Decrement parent's repliesCount if this was a reply
        if (doubt.parentComment) {
            await Doubt.findByIdAndUpdate(doubt.parentComment, { $inc: { repliesCount: -1 } });
        }

        await doubt.deleteOne();

        res.json({ success: true, message: 'Comment permanently deleted' });
    } catch (error) {
        console.error('permanentDeleteDoubt error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/doubts/admin/report/:reportId — admin: update report status
exports.updateReportStatus = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { status } = req.body;

        if (!['reviewed', 'dismissed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const report = await CommentReport.findByIdAndUpdate(
            reportId,
            { status },
            { new: true }
        );

        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        res.json({ success: true, report });
    } catch (error) {
        console.error('updateReportStatus error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/doubts/:doubtId/detail — get single thread + increment views
exports.getThreadDetail = async (req, res) => {
    try {
        const { doubtId } = req.params;

        const existingThread = await Doubt.findById(doubtId).select('_id views');
        if (!existingThread) {
            return res.status(404).json({ success: false, message: 'Thread not found' });
        }

        const requesterId = req.user?._id?.toString() || req.user?.id?.toString() || null;

        if (requesterId) {
            const timestampMs = Date.now();
            const upsertResult = await DoubtView.updateOne(
                {
                    doubt: existingThread._id,
                    viewerUser: requesterId
                },
                {
                    $setOnInsert: {
                        windowStartAt: getViewWindowStart(timestampMs),
                        viewedAt: new Date(timestampMs)
                    }
                },
                { upsert: true }
            );

            // Count only when this request inserts the first-ever view record for this user on this post.
            if (upsertResult.upsertedCount === 1) {
                await Doubt.updateOne({ _id: existingThread._id }, { $inc: { views: 1 } });
            }
        }

        const thread = await Doubt.findById(doubtId).populate('user', 'username avatar');
        if (!thread) {
            return res.status(404).json({ success: false, message: 'Thread not found' });
        }

        let hasLiked = false;
        let hasDisliked = false;
        if (requesterId) {
            const reaction = await CommentReaction.findOne({ comment: doubtId, user: requesterId });
            hasLiked = reaction?.type === 'like';
            hasDisliked = reaction?.type === 'dislike';
        }

        const obj = thread.toObject();
        obj.imageUrl = normalizeImageUrl(obj.imageUrl);
        obj.hasLiked = hasLiked;
        obj.hasDisliked = hasDisliked;
        obj.isSaved = requesterId ? (await getSavedDoubtIdSet(req, requesterId)).has(thread._id.toString()) : false;

        res.json({ success: true, thread: obj });
    } catch (error) {
        console.error('getThreadDetail error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
