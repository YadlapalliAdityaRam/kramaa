const SUSPICIOUS_KEY_PATTERN = /(^\$)|\./;

const sanitizeValue = (value) => {
    if (Array.isArray(value)) {
        return value.map((entry) => sanitizeValue(entry));
    }

    if (value && typeof value === 'object') {
        return Object.entries(value).reduce((acc, [key, nestedValue]) => {
            if (SUSPICIOUS_KEY_PATTERN.test(String(key))) {
                return acc;
            }
            acc[key] = sanitizeValue(nestedValue);
            return acc;
        }, {});
    }

    if (typeof value === 'string') {
        return value.replace(/\0/g, '');
    }

    return value;
};

const requestSanitizer = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeValue(req.body);
    }
    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeValue(req.query);
    }
    if (req.params && typeof req.params === 'object') {
        req.params = sanitizeValue(req.params);
    }
    next();
};

module.exports = {
    requestSanitizer
};
