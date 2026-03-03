const Setting = require('../models/Setting');

// Get a setting by key
exports.getSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const setting = await Setting.findOne({ key });

        res.json({
            success: true,
            value: setting ? setting.value : null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update a setting (Super Admin only)
exports.updateSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        const setting = await Setting.findOneAndUpdate(
            { key },
            { value, updatedBy: req.user.id, updatedAt: Date.now() },
            { upsert: true, new: true }
        );

        res.json({ success: true, setting });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all settings (Super Admin)
exports.getAllSettings = async (req, res) => {
    try {
        const settings = await Setting.find().populate('updatedBy', 'username');
        res.json({ success: true, settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
