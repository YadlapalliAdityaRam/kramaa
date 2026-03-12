const path = require('path');
const dotenv = require('dotenv');
const { generateNumericOtp, getOtpTtlMinutes } = require('../services/auth/otpService');
const { buildOtpEmailTemplate } = require('../services/email/authEmailTemplates');
const { sendEmailViaBrevo } = require('../services/email/brevoEmailService');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
const maskSecret = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return 'not-set';
    if (raw.length <= 12) return `${raw.slice(0, 4)}****`;
    return `${raw.slice(0, 8)}...${raw.slice(-6)}`;
};

const testOtpDelivery = async ({ email, name = 'Test User' }) => {
    const recipientEmail = String(email || '').trim().toLowerCase();
    if (!isValidEmail(recipientEmail)) {
        throw new Error('Valid email is required. Usage: npm run test:otp-delivery -- user@example.com');
    }

    const otp = generateNumericOtp();
    const expiresInMinutes = getOtpTtlMinutes();
    const appName = String(process.env.APP_NAME || 'Kramaa').trim() || 'Kramaa';

    const template = buildOtpEmailTemplate({
        appName,
        recipientName: name,
        otp,
        purposeLabel: 'OTP delivery test',
        expiresInMinutes
    });

    const result = await sendEmailViaBrevo({
        toEmail: recipientEmail,
        toName: name,
        subject: `[${appName}] OTP Delivery Test`,
        htmlContent: template.html,
        textContent: template.text
    });

    return {
        delivered: Boolean(result?.delivered),
        provider: result?.provider || 'unknown',
        messageId: result?.messageId || null,
        otp
    };
};

const run = async () => {
    const emailArg = process.argv[2] || process.env.TEST_OTP_EMAIL;
    const nameArg = process.argv[3] || process.env.TEST_OTP_NAME || 'Test User';

    console.log('Brevo config check:');
    console.log(`- BREVO_API_KEY: ${maskSecret(process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY)}`);
    console.log(`- AUTH_EMAIL_FROM: ${String(process.env.AUTH_EMAIL_FROM || process.env.SMTP_FROM || '').trim() || 'not-set'}`);

    const output = await testOtpDelivery({ email: emailArg, name: nameArg });

    console.log('OTP delivery test result:');
    console.log(`- delivered: ${output.delivered}`);
    console.log(`- provider: ${output.provider}`);
    console.log(`- messageId: ${output.messageId || 'N/A'}`);
    console.log(`- otp (for verification): ${output.otp}`);
};

if (require.main === module) {
    run()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('OTP delivery test failed:', error.message);
            if (error?.providerMessage) {
                console.error('Brevo provider message:', error.providerMessage);
            }
            process.exit(1);
        });
}

module.exports = { testOtpDelivery };
