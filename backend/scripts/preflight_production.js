const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const failures = [];
const warnings = [];

const requiredEnv = [
    'NODE_ENV',
    'PORT',
    'MONGODB_URI',
    'JWT_SECRET',
    'CLIENT_URL'
];

const placeholderPatterns = [
    /your[_-]?/i,
    /replace[-_ ]with/i,
    /changeme/i,
    /example/i,
    /test[_-]?key/i
];

const getValue = (name) => String(process.env[name] || '').trim();

const assertRequired = (name) => {
    const value = getValue(name);
    if (!value) {
        failures.push(`Missing required env: ${name}`);
        return;
    }
    if (placeholderPatterns.some((pattern) => pattern.test(value))) {
        failures.push(`Env ${name} appears to use a placeholder value.`);
    }
};

for (const key of requiredEnv) {
    assertRequired(key);
}

const nodeEnv = getValue('NODE_ENV').toLowerCase();
if (nodeEnv !== 'production') {
    warnings.push(`NODE_ENV is '${nodeEnv || 'unset'}'. Expected 'production' for deployment.`);
}

const jwtSecret = getValue('JWT_SECRET');
if (jwtSecret && jwtSecret.length < 32) {
    failures.push('JWT_SECRET must be at least 32 characters for production.');
}
if (/algoverse_super_secret_key_2026/i.test(jwtSecret)) {
    failures.push('JWT_SECRET uses a known weak default. Replace it before deployment.');
}

const mongoUri = getValue('MONGODB_URI');
if (mongoUri && !/^mongodb(\+srv)?:\/\//i.test(mongoUri)) {
    failures.push('MONGODB_URI is not a valid MongoDB connection URI.');
}

const clientUrl = getValue('CLIENT_URL');
if (clientUrl) {
    try {
        new URL(clientUrl);
    } catch {
        failures.push('CLIENT_URL is not a valid URL.');
    }
}

const corsOrigins = getValue('CORS_ALLOWED_ORIGINS');
if (!corsOrigins && nodeEnv === 'production') {
    failures.push('CORS_ALLOWED_ORIGINS must be set in production.');
}

const brevoKey = getValue('BREVO_API_KEY');
if (!brevoKey) {
    warnings.push('BREVO_API_KEY is not set. OTP/password-reset emails will fail in production.');
}

const envFilePath = path.resolve(__dirname, '..', '.env');
if (!fs.existsSync(envFilePath)) {
    failures.push('backend/.env file not found.');
}

const printSection = (title, rows) => {
    if (!rows.length) return;
    console.log(`\n${title}`);
    rows.forEach((row) => console.log(`- ${row}`));
};

if (failures.length > 0) {
    console.error('Production preflight FAILED.');
    printSection('Blocking issues:', failures);
    printSection('Warnings:', warnings);
    process.exit(1);
}

console.log('Production preflight PASSED.');
printSection('Warnings:', warnings);
process.exit(0);
