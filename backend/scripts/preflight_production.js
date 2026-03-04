const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
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

const commandExists = (command) => {
    if (!command) return false;
    const normalized = String(command).trim().replace(/^"(.*)"$/, '$1');
    if (!normalized) return false;

    try {
        if (normalized.includes('/') || normalized.includes('\\')) {
            return fs.existsSync(normalized);
        }
        const probeCmd = process.platform === 'win32'
            ? `where.exe ${normalized}`
            : `command -v ${normalized}`;
        execSync(probeCmd, { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
};

const commandExistsInDockerImage = (imageName, command) => {
    if (!imageName || !command) return false;
    const escapedCommand = String(command).replace(/(["$`\\])/g, '\\$1');
    try {
        execSync(
            `docker run --rm --entrypoint sh ${imageName} -lc "command -v ${escapedCommand} >/dev/null 2>&1"`,
            { stdio: 'ignore' }
        );
        return true;
    } catch {
        return false;
    }
};

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

const useDocker = getValue('USE_DOCKER').toLowerCase() === 'true';
if (useDocker) {
    const runnerImage = getValue('DOCKER_RUNNER_IMAGE') || 'algoverse-runner';

    if (!commandExists('docker')) {
        failures.push('USE_DOCKER=true but Docker CLI is not available on this host.');
    } else {
        try {
            execSync(`docker inspect --type=image ${runnerImage}`, { stdio: 'ignore' });
        } catch {
            failures.push(`Docker image '${runnerImage}' is missing. Build it from backend/docker/Dockerfile.`);
        }
    }

    if (failures.length === 0 || !failures.some((entry) => entry.includes('Docker image'))) {
        const dockerRuntimeCommands = [
            { key: 'node', label: 'JavaScript runtime (node)' },
            { key: 'python3', label: 'Python runtime (python3)' },
            { key: 'javac', label: 'Java compiler (javac)' },
            { key: 'java', label: 'Java runtime (java)' },
            { key: 'g++', label: 'C++ compiler (g++)' },
            { key: 'gcc', label: 'C compiler (gcc)' }
        ];

        const missingInImage = dockerRuntimeCommands
            .filter((entry) => !commandExistsInDockerImage(runnerImage, entry.key))
            .map((entry) => entry.label);

        if (missingInImage.length > 0) {
            failures.push(
                `Docker image '${runnerImage}' is missing language dependencies: ${missingInImage.join(', ')}. Rebuild the runner image.`
            );
        }
    }
} else {
    const pythonCandidates = process.platform === 'win32'
        ? ['py', 'python', 'python3']
        : ['python3'];
    const pythonBinary = pythonCandidates.find((candidate) => commandExists(candidate)) || pythonCandidates[0];
    const requiredRuntimeCommands = [
        { key: 'node', label: 'JavaScript runtime (node)' },
        { key: pythonBinary, label: `Python runtime (${pythonBinary})` },
        { key: getValue('JAVAC_PATH') || 'javac', label: 'Java compiler (javac)' },
        { key: getValue('JAVA_PATH') || 'java', label: 'Java runtime (java)' },
        { key: 'g++', label: 'C++ compiler (g++)' },
        { key: 'gcc', label: 'C compiler (gcc)' }
    ];

    const missingRuntimeCommands = requiredRuntimeCommands
        .filter((entry) => !commandExists(entry.key))
        .map((entry) => entry.label);

    if (missingRuntimeCommands.length > 0) {
        failures.push(
            `Missing execution runtime dependencies: ${missingRuntimeCommands.join(', ')}. ` +
            `Install toolchains or enable USE_DOCKER=true with the '${process.env.DOCKER_RUNNER_IMAGE || 'algoverse-runner'}' image.`
        );
    }
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
