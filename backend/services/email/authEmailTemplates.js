const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const buildOtpEmailTemplate = ({
    appName = 'Krama',
    recipientName = 'User',
    otp,
    purposeLabel,
    expiresInMinutes
}) => {
    const safeName = escapeHtml(recipientName);
    const safeOtp = escapeHtml(otp);
    const safePurpose = escapeHtml(purposeLabel);
    const safeAppName = escapeHtml(appName);

    const text = [
        `Hello ${recipientName},`,
        '',
        `${safePurpose} OTP: ${otp}`,
        `This OTP will expire in ${expiresInMinutes} minutes.`,
        '',
        `If you did not request this, please ignore this email.`,
        '',
        `- ${appName}`
    ].join('\n');

    const html = `
        <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
            <h2 style="margin: 0 0 12px;">${safeAppName} Security Code</h2>
            <p>Hello <strong>${safeName}</strong>,</p>
            <p>Use this OTP to complete <strong>${safePurpose}</strong>:</p>
            <div style="display: inline-block; font-size: 28px; letter-spacing: 4px; font-weight: 700; padding: 10px 16px; border-radius: 8px; background: #0f172a; color: #f8fafc;">
                ${safeOtp}
            </div>
            <p style="margin-top: 12px;">This OTP expires in <strong>${expiresInMinutes} minutes</strong>.</p>
            <p>If you did not request this, you can safely ignore this email.</p>
        </div>
    `;

    return { text, html };
};

const buildPasswordResetEmailTemplate = ({
    appName = 'Krama',
    recipientName = 'User',
    resetLink,
    expiresInMinutes
}) => {
    const safeName = escapeHtml(recipientName);
    const safeLink = escapeHtml(resetLink);
    const safeAppName = escapeHtml(appName);

    const text = [
        `Hello ${recipientName},`,
        '',
        'We received a request to reset your password.',
        `Reset link: ${resetLink}`,
        `This link expires in ${expiresInMinutes} minutes.`,
        '',
        'If you did not request this, please ignore this email.',
        '',
        `- ${appName}`
    ].join('\n');

    const html = `
        <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
            <h2 style="margin: 0 0 12px;">${safeAppName} Password Reset</h2>
            <p>Hello <strong>${safeName}</strong>,</p>
            <p>We received a request to reset your password.</p>
            <p>
                <a href="${safeLink}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;">
                    Reset Password
                </a>
            </p>
            <p>This link expires in <strong>${expiresInMinutes} minutes</strong>.</p>
            <p>If you did not request this, please ignore this email.</p>
        </div>
    `;

    return { text, html };
};

module.exports = {
    buildOtpEmailTemplate,
    buildPasswordResetEmailTemplate
};

