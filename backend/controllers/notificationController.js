const notificationService = require('../services/notificationService');

exports.getNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

        const result = await notificationService.getUserNotifications(req.user.id, { page, limit });

        return res.json({
            success: true,
            ...result
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to fetch notifications' });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const count = await notificationService.getUnreadCount(req.user.id);
        return res.json({ success: true, count });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to get unread count' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const notification = await notificationService.markAsRead(req.user.id, req.params.id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        return res.json({ success: true, notification });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to mark notification' });
    }
};

exports.markAllRead = async (req, res) => {
    try {
        const result = await notificationService.markAllRead(req.user.id);
        return res.json({ success: true, modifiedCount: result.modifiedCount });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to mark all notifications' });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        const notification = await notificationService.deleteNotification(req.user.id, req.params.id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        return res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to delete notification' });
    }
};
