const Notification = require('../models/Notification');

/**
 * Emit a real-time notification to a specific user via Socket.IO.
 * @param {object} req  – Express request (to access app.get('io'))
 * @param {string} userId
 * @param {object} payload – notification doc (lean)
 */
const emitToUser = (req, userId, payload) => {
    try {
        const io = req?.app?.get?.('io');
        if (io) {
            io.to(`notifications:${userId}`).emit('notification:new', payload);
        }
    } catch (_) {
        // Socket emit is best-effort; never block the main flow
    }
};

/**
 * Create and persist a notification, then push it in real-time.
 */
const createNotification = async (req, userId, { type = 'system', title, message = '', link = '', icon = '🔔' }) => {
    const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        link,
        icon
    });

    const lean = notification.toObject();
    emitToUser(req, String(userId), lean);

    return lean;
};

/**
 * Broadcast a notification to many users at once (e.g. new contest).
 */
const broadcastNotification = async (req, userIds, { type = 'system', title, message = '', link = '', icon = '🔔' }) => {
    if (!userIds || userIds.length === 0) return [];

    const docs = userIds.map(uid => ({
        userId: uid,
        type,
        title,
        message,
        link,
        icon
    }));

    const created = await Notification.insertMany(docs, { ordered: false });

    // Emit to each user's room
    const io = req?.app?.get?.('io');
    if (io) {
        const payload = { type, title, message, link, icon, isRead: false, createdAt: new Date() };
        for (const uid of userIds) {
            io.to(`notifications:${uid}`).emit('notification:new', payload);
        }
    }

    return created;
};

/**
 * Fetch notifications for a user (paginated).
 */
const getUserNotifications = async (userId, { page = 1, limit = 20 } = {}) => {
    const skip = (Math.max(1, page) - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Notification.countDocuments({ userId }),
        Notification.countDocuments({ userId, isRead: false })
    ]);

    return { notifications, total, unreadCount, page, limit };
};

/**
 * Get unread count.
 */
const getUnreadCount = async (userId) => {
    return Notification.countDocuments({ userId, isRead: false });
};

/**
 * Mark a single notification as read.
 */
const markAsRead = async (userId, notificationId) => {
    const result = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true },
        { new: true }
    );
    return result;
};

/**
 * Mark all notifications as read.
 */
const markAllRead = async (userId) => {
    const result = await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
    );
    return result;
};

/**
 * Delete a single notification.
 */
const deleteNotification = async (userId, notificationId) => {
    const result = await Notification.findOneAndDelete({ _id: notificationId, userId });
    return result;
};

module.exports = {
    createNotification,
    broadcastNotification,
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllRead,
    deleteNotification
};
