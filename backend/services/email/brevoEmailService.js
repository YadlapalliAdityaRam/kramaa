const axios = require('axios');

const BREVO_API_BASE_URL = 'https://api.brevo.com/v3';

const toBoolean = (value, fallback = false) => {
    if (value === undefined || value === null || value === '') return fallback;
    return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const shouldRequireEmailDelivery = () => {
    const defaultValue = String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production';
    return toBoolean(process.env.AUTH_REQUIRE_EMAIL_DELIVERY, defaultValue);
};

const getBrevoConfig = () => {
    const apiKey = String(process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || '').trim();
    const fromEmail = String(process.env.AUTH_EMAIL_FROM || process.env.SMTP_FROM || '').trim();
    const fromName = String(process.env.AUTH_EMAIL_FROM_NAME || process.env.APP_NAME || 'Kramaa').trim();

    return { apiKey, fromEmail, fromName };
};

const formatEmailAddress = (rawEmail) => String(rawEmail || '').trim().toLowerCase();

const sendEmailViaBrevo = async ({
    toEmail,
    toName,
    subject,
    htmlContent,
    textContent
}) => {
    const { apiKey, fromEmail, fromName } = getBrevoConfig();
    const recipientEmail = formatEmailAddress(toEmail);

    if (!recipientEmail || !subject || (!htmlContent && !textContent)) {
        const err = new Error('Invalid email payload.');
        err.statusCode = 500;
        throw err;
    }

    if (!apiKey || !fromEmail) {
        if (shouldRequireEmailDelivery()) {
            const err = new Error('Brevo email delivery is not configured.');
            err.statusCode = 500;
            throw err;
        }
        return {
            delivered: false,
            provider: 'brevo',
            skipped: true
        };
    }

    try {
        const { data } = await axios.post(
            `${BREVO_API_BASE_URL}/smtp/email`,
            {
                sender: { email: fromEmail, name: fromName || undefined },
                to: [{ email: recipientEmail, name: String(toName || '').trim() || undefined }],
                subject,
                htmlContent: htmlContent || undefined,
                textContent: textContent || undefined
            },
            {
                headers: {
                    'api-key': apiKey,
                    'content-type': 'application/json',
                    accept: 'application/json'
                },
                timeout: 10000
            }
        );

        return {
            delivered: true,
            provider: 'brevo',
            messageId: data?.messageId || null
        };
    } catch (error) {
        const status = Number(error?.response?.status || 0);
        const brevoMessage =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            'Email delivery failed.';

        const sanitizedError = new Error(`Email delivery failed (${status || 'network'}).`);
        sanitizedError.statusCode = status >= 400 && status < 500 ? 502 : 503;
        sanitizedError.providerMessage = brevoMessage;
        throw sanitizedError;
    }
};

module.exports = {
    sendEmailViaBrevo
};
