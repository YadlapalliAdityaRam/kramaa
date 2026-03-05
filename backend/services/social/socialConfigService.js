const Setting = require('../../models/Setting');

const SOCIAL_SETTING_KEYS = Object.freeze({
    FOLLOW_SYSTEM_ENABLED: 'social_follow_system_enabled',
    MAX_FOLLOWS_PER_DAY: 'social_max_follows_per_day',
    MAX_NOTIFICATIONS_PER_HOUR: 'social_max_notifications_per_hour',
    FEED_LIMIT: 'social_feed_limit'
});

const DEFAULT_SOCIAL_CONFIG = Object.freeze({
    followSystemEnabled: true,
    maxFollowsPerDay: 100,
    maxNotificationsPerHour: 20,
    feedLimit: 50
});

const toPositiveInt = (value, fallback) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.trunc(parsed);
};

const toBoolean = (value, fallback) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true') return true;
        if (normalized === 'false') return false;
    }
    return fallback;
};

const getSettingValue = async (key, fallback) => {
    const setting = await Setting.findOne({ key }).select('value').lean();
    return setting ? setting.value : fallback;
};

const getSocialConfig = async () => {
    const [
        followSystemEnabledValue,
        maxFollowsPerDayValue,
        maxNotificationsPerHourValue,
        feedLimitValue
    ] = await Promise.all([
        getSettingValue(SOCIAL_SETTING_KEYS.FOLLOW_SYSTEM_ENABLED, DEFAULT_SOCIAL_CONFIG.followSystemEnabled),
        getSettingValue(SOCIAL_SETTING_KEYS.MAX_FOLLOWS_PER_DAY, DEFAULT_SOCIAL_CONFIG.maxFollowsPerDay),
        getSettingValue(SOCIAL_SETTING_KEYS.MAX_NOTIFICATIONS_PER_HOUR, DEFAULT_SOCIAL_CONFIG.maxNotificationsPerHour),
        getSettingValue(SOCIAL_SETTING_KEYS.FEED_LIMIT, DEFAULT_SOCIAL_CONFIG.feedLimit)
    ]);

    return {
        followSystemEnabled: toBoolean(followSystemEnabledValue, DEFAULT_SOCIAL_CONFIG.followSystemEnabled),
        maxFollowsPerDay: toPositiveInt(maxFollowsPerDayValue, DEFAULT_SOCIAL_CONFIG.maxFollowsPerDay),
        maxNotificationsPerHour: toPositiveInt(
            maxNotificationsPerHourValue,
            DEFAULT_SOCIAL_CONFIG.maxNotificationsPerHour
        ),
        feedLimit: Math.min(100, toPositiveInt(feedLimitValue, DEFAULT_SOCIAL_CONFIG.feedLimit))
    };
};

const updateSocialConfig = async (updates, updatedBy = null) => {
    const nextConfig = {
        followSystemEnabled: Object.prototype.hasOwnProperty.call(updates || {}, 'followSystemEnabled')
            ? Boolean(updates.followSystemEnabled)
            : undefined,
        maxFollowsPerDay: Object.prototype.hasOwnProperty.call(updates || {}, 'maxFollowsPerDay')
            ? toPositiveInt(updates.maxFollowsPerDay, DEFAULT_SOCIAL_CONFIG.maxFollowsPerDay)
            : undefined,
        maxNotificationsPerHour: Object.prototype.hasOwnProperty.call(updates || {}, 'maxNotificationsPerHour')
            ? toPositiveInt(updates.maxNotificationsPerHour, DEFAULT_SOCIAL_CONFIG.maxNotificationsPerHour)
            : undefined,
        feedLimit: Object.prototype.hasOwnProperty.call(updates || {}, 'feedLimit')
            ? Math.min(100, toPositiveInt(updates.feedLimit, DEFAULT_SOCIAL_CONFIG.feedLimit))
            : undefined
    };

    const writes = [];

    if (nextConfig.followSystemEnabled !== undefined) {
        writes.push(Setting.findOneAndUpdate(
            { key: SOCIAL_SETTING_KEYS.FOLLOW_SYSTEM_ENABLED },
            { value: nextConfig.followSystemEnabled, updatedBy, updatedAt: new Date() },
            { upsert: true, new: true }
        ));
    }

    if (nextConfig.maxFollowsPerDay !== undefined) {
        writes.push(Setting.findOneAndUpdate(
            { key: SOCIAL_SETTING_KEYS.MAX_FOLLOWS_PER_DAY },
            { value: nextConfig.maxFollowsPerDay, updatedBy, updatedAt: new Date() },
            { upsert: true, new: true }
        ));
    }

    if (nextConfig.maxNotificationsPerHour !== undefined) {
        writes.push(Setting.findOneAndUpdate(
            { key: SOCIAL_SETTING_KEYS.MAX_NOTIFICATIONS_PER_HOUR },
            { value: nextConfig.maxNotificationsPerHour, updatedBy, updatedAt: new Date() },
            { upsert: true, new: true }
        ));
    }

    if (nextConfig.feedLimit !== undefined) {
        writes.push(Setting.findOneAndUpdate(
            { key: SOCIAL_SETTING_KEYS.FEED_LIMIT },
            { value: nextConfig.feedLimit, updatedBy, updatedAt: new Date() },
            { upsert: true, new: true }
        ));
    }

    if (writes.length > 0) {
        await Promise.all(writes);
    }

    return getSocialConfig();
};

module.exports = {
    SOCIAL_SETTING_KEYS,
    DEFAULT_SOCIAL_CONFIG,
    getSocialConfig,
    updateSocialConfig
};
