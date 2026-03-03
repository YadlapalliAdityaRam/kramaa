const User = require('../models/User');
const mongoose = require('mongoose');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const Profile = require('../models/Profile');
const crypto = require('crypto');
const auditLogger = require('../services/auditLogger');
const globalRankService = require('../services/globalRankService');

// Safe fields to return for public user profiles (never leak sensitive data)
const USER_SAFE_FIELDS = 'username avatar level xp streak stats badges rating contestStats totalSolvedEasy totalSolvedMedium totalSolvedHard problemAcceptanceRate finalScore globalRank createdAt';
const USER_SEARCH_FIELDS = 'username avatar level stats.totalProblems rating.current badges';

exports.getLeaderboard = async (req, res) => {
    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);

        const hasMissingRanks = await User.exists({
            role: 'USER',
            accountStatus: { $ne: 'Deleted' },
            $or: [{ globalRank: null }, { globalRank: { $exists: false } }]
        });

        if (hasMissingRanks) {
            await globalRankService.bootstrapAllUserMetrics();
            await globalRankService.recomputeGlobalRanks();
        }

        const users = await User.find({
            role: 'USER',
            accountStatus: { $ne: 'Deleted' }
        })
            .select('username avatar level xp stats finalScore globalRank problemAcceptanceRate totalSolvedEasy totalSolvedMedium totalSolvedHard')
            .sort({
                finalScore: -1,
                totalSolvedHard: -1,
                problemAcceptanceRate: -1,
                createdAt: 1,
                _id: 1
            })
            .limit(limit)
            .lean();

        const rankedUsers = users.map((user, index) => ({
            ...user,
            globalRank: user.globalRank || index + 1
        }));

        res.json({ success: true, users: rankedUsers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getUserStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Heatmap Data (Last 365 days)
        const oneYearAgo = new Date();
        oneYearAgo.setDate(oneYearAgo.getDate() - 365);

        const heatmapData = await Submission.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId), createdAt: { $gte: oneYearAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            }
        ]);

        // 2. Topic Breakdown (from Solved Problems)
        // Find user to get solvedProblems IDs
        const user = await User.findById(userId).populate('solvedProblems', 'tags difficulty');

        const topicStats = {};
        const difficultyStats = { Easy: 0, Medium: 0, Hard: 0 };

        if (user.solvedProblems) {
            user.solvedProblems.forEach(problem => {
                // Difficulty
                if (problem.difficulty) {
                    difficultyStats[problem.difficulty] = (difficultyStats[problem.difficulty] || 0) + 1;
                }

                // Tags
                if (problem.tags && problem.tags.length > 0) {
                    problem.tags.forEach(tag => {
                        topicStats[tag] = (topicStats[tag] || 0) + 1;
                    });
                }
            });
        }

        res.json({
            success: true,
            heatmap: heatmapData,
            topics: topicStats,
            difficulties: difficultyStats
        });
    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Super Admin: Create new admin
exports.createAdmin = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        user = new User({
            username,
            email,
            password,
            role: 'ADMIN',
            isVerified: true // Admins created by Super Admin are auto-verified
        });

        await user.save();

        await auditLogger.log(req.user._id, 'ADMIN_CREATE', 'USER', {
            createdEmail: email
        }, req.ip);

        res.status(201).json({ success: true, message: 'Admin created successfully', user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Super Admin: Update user role
exports.updateRole = async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!['USER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const oldRole = user.role;
        user.role = role;
        await user.save();

        await auditLogger.log(req.user._id, 'ROLE_UPDATE', 'USER', {
            targetUser: user.email,
            oldRole,
            newRole: role
        }, req.ip);

        res.json({ success: true, message: `User role updated to ${role}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Super Admin: Invite new admin
exports.inviteAdmin = async (req, res) => {
    try {
        const { email, role } = req.body;

        if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        let user = await User.findOne({ email });
        if (user) {
            // If user exists, check if they are already an admin
            if (user.role === role) {
                return res.status(400).json({ success: false, message: `User is already a ${role}` });
            }
            if (user.role === 'SUPER_ADMIN') {
                return res.status(400).json({ success: false, message: 'User is a Super Admin' });
            }

            // Promote existing user
            const oldRole = user.role;
            user.role = role;
            await user.save();

            await auditLogger.log(req.user._id, 'ROLE_ADJUSTMENT', 'USER', {
                targetUser: email,
                oldRole,
                newRole: role,
                reason: 'Promoted via Invite'
            }, req.ip);

            return res.json({ success: true, message: `Existing user promoted to ${role}` });
        }

        // Generate invitation token
        const invitationToken = crypto.randomBytes(20).toString('hex');
        const invitationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        // Create user with temporary password and unrelated fields
        user = new User({
            username: email.split('@')[0],
            email,
            password: crypto.randomBytes(10).toString('hex'),
            role,
            invitationToken: crypto.createHash('sha256').update(invitationToken).digest('hex'),
            invitationExpires,
            isVerified: false
        });

        await user.save();

        const invitationLink = `${process.env.CLIENT_URL}/admin/accept-invite/${invitationToken}`;

        await auditLogger.log(req.user._id, 'ADMIN_INVITE', 'USER', {
            invitedEmail: email,
            assignedRole: role
        }, req.ip);

        res.status(201).json({
            success: true,
            message: 'Admin invited successfully',
            invitationLink
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Accept Admin Invitation
exports.acceptInvitation = async (req, res) => {
    try {
        const { token, password, username } = req.body;

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            invitationToken: hashedToken,
            invitationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        }

        user.password = password;
        user.username = username || user.username;
        user.isVerified = true;
        user.invitationToken = undefined;
        user.invitationExpires = undefined;

        await user.save();

        await auditLogger.log(user._id, 'ADMIN_ACTIVATE', 'USER', {
            email: user.email
        }, req.ip);

        res.json({ success: true, message: 'Account activated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Super Admin: Revoke Admin Access
exports.revokeAdmin = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role === 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Cannot revoke Super Admin' });
        }

        const oldRole = user.role;
        user.role = 'USER';
        await user.save();

        await auditLogger.log(req.user._id, 'ADMIN_REVOKE', 'USER', {
            targetUser: user.email,
            previousRole: oldRole
        }, req.ip);

        res.json({ success: true, message: 'Admin access revoked' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get All Admins (Super Admin only)
exports.getAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } })
            .select('-password');
        res.json({ success: true, admins });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// =============================================
// USER SEARCH & PUBLIC PROFILE
// =============================================

// @route   GET /api/users/search?username=<query>
// @desc    Search users by username (returns only public profiles)
// @access  Public
exports.searchUsers = async (req, res) => {
    try {
        const { username } = req.query;

        if (!username || typeof username !== 'string' || !username.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Username query parameter is required'
            });
        }

        const sanitized = username.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Find matching users (case-insensitive prefix match, exclude deleted/suspended)
        const users = await User.find({
            username: { $regex: new RegExp(`^${sanitized}`, 'i') },
            accountStatus: { $ne: 'Deleted' }
        })
            .select(USER_SEARCH_FIELDS)
            .limit(20)
            .lean();

        if (users.length === 0) {
            return res.json({ success: true, users: [] });
        }

        // Filter out users whose profiles are private
        const userIds = users.map(u => u._id);
        const profiles = await Profile.find({
            user: { $in: userIds },
            'preferences.isPublic': true
        })
            .select('user bio')
            .lean();

        const publicUserIds = new Set(profiles.map(p => p.user.toString()));
        const profileMap = new Map(profiles.map(p => [p.user.toString(), p]));

        // Also include users who have NO profile document yet (default is public)
        const usersWithProfile = new Set(
            (await Profile.find({ user: { $in: userIds } }).select('user').lean())
                .map(p => p.user.toString())
        );

        const results = users
            .filter(u => {
                const id = u._id.toString();
                // Include if profile is public OR if no profile exists (default public)
                return publicUserIds.has(id) || !usersWithProfile.has(id);
            })
            .map(u => {
                const profile = profileMap.get(u._id.toString());
                return {
                    username: u.username,
                    avatar: u.avatar,
                    level: u.level,
                    bio: profile?.bio || '',
                    problemsSolved: u.stats?.totalProblems || 0,
                    rating: u.rating?.current || 1200,
                    badges: (u.badges || []).map(b => ({
                        id: b.id,
                        name: b.name,
                        icon: b.icon,
                        tier: b.tier
                    }))
                };
            });

        res.json({ success: true, users: results });
    } catch (error) {
        console.error('Search Users Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   GET /api/users/profile/:username
// @desc    Get user profile by username (with privacy check)
// @access  Public
exports.getUserByUsername = async (req, res) => {
    try {
        const { username } = req.params;

        if (!username || typeof username !== 'string' || !username.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Username is required'
            });
        }

        // Case-insensitive exact match
        const user = await User.findOne({
            username: { $regex: new RegExp(`^${username.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
            accountStatus: { $ne: 'Deleted' }
        }).select(USER_SAFE_FIELDS);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check profile visibility
        const profile = await Profile.findOne({ user: user._id })
            .select('bio title website location social experienceLevel skills preferences');

        // If profile exists and is explicitly private → 403
        if (profile && !profile.preferences?.isPublic) {
            return res.status(403).json({
                success: false,
                message: 'This profile is private'
            });
        }

        // Build safe response
        const response = {
            username: user.username,
            avatar: user.avatar,
            level: user.level,
            xp: user.xp,
            streak: user.streak,
            bio: profile?.bio || '',
            title: profile?.title || 'Coder',
            website: profile?.website || '',
            location: profile?.location || {},
            social: profile?.social || {},
            experienceLevel: profile?.experienceLevel || 'Beginner',
            skills: profile?.skills || [],
            problemsSolved: user.stats?.totalProblems || 0,
            stats: user.stats,
            rating: user.rating,
            badges: (user.badges || []).map(b => ({
                id: b.id,
                name: b.name,
                description: b.description,
                icon: b.icon,
                tier: b.tier,
                earnedAt: b.earnedAt
            })),
            contestStats: user.contestStats,
            totalSolvedEasy: user.totalSolvedEasy,
            totalSolvedMedium: user.totalSolvedMedium,
            totalSolvedHard: user.totalSolvedHard,
            problemAcceptanceRate: user.problemAcceptanceRate,
            globalRank: user.globalRank,
            memberSince: user.createdAt
        };

        res.json({ success: true, user: response });
    } catch (error) {
        console.error('Get User By Username Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   POST /api/users/message/:userId
// @desc    Send a direct message to a user
// @access  Private
exports.sendMessage = async (req, res) => {
    try {
        const { userId } = req.params;
        const { message } = req.body;
        const senderId = req.user.id;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Message content is required' });
        }

        if (userId === senderId) {
            return res.status(400).json({ success: false, message: 'Cannot message yourself' });
        }

        const recipient = await User.findById(userId);
        if (!recipient) {
            return res.status(404).json({ success: false, message: 'Recipient not found' });
        }

        const sender = await User.findById(senderId).select('username avatar');

        // Create the notification
        const Notification = require('../models/Notification');
        const notification = new Notification({
            userId: recipient._id,
            type: 'message',
            title: `New message from ${sender.username}`,
            message: message.trim(),
            link: `/profile/${sender.username}`,
            icon: '💬'
        });
        await notification.save();

        // Emit real-time notification if socket server is available
        if (req.app.get('io')) {
            req.app.get('io').to(recipient._id.toString()).emit('notification', notification);
        }

        res.status(200).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Send Message Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
