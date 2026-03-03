const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const nodemonBin = process.platform === 'win32' ? 'nodemon.cmd' : 'nodemon';
const nodemonPath = path.join(rootDir, 'node_modules', '.bin', nodemonBin);
const useNodemon = fs.existsSync(nodemonPath) && process.env.USE_NODEMON_DUAL === 'true';
let shuttingDown = false;
const children = new Map();

const startServer = (port, label) => {
    const command = useNodemon ? nodemonPath : process.execPath;
    const args = useNodemon
        ? ['--config', 'nodemon.json', 'server.js']
        : [path.join(rootDir, 'server.js')];

    const child = spawn(command, args, {
        cwd: rootDir,
        env: {
            ...process.env,
            PORT: String(port),
            BACKEND_INSTANCE_COUNT: '2',
            BACKEND_PORTS: '5000,5001'
        },
        shell: useNodemon && process.platform === 'win32',
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.on('data', (chunk) => {
        process.stdout.write(`[${label}] ${chunk}`);
    });

    child.stderr.on('data', (chunk) => {
        process.stderr.write(`[${label}] ${chunk}`);
    });

    child.on('exit', (code, signal) => {
        const reason = signal ? `signal ${signal}` : `code ${code}`;
        process.stdout.write(`[${label}] exited with ${reason}\n`);
        children.delete(label);

        if (!shuttingDown) {
            setTimeout(() => {
                if (shuttingDown) return;
                process.stdout.write(`[${label}] restarting...\n`);
                children.set(label, startServer(port, label));
            }, 1500);
        }
    });

    child.on('error', (error) => {
        process.stderr.write(`[${label}] failed to start: ${error.message}\n`);
    });

    return child;
};

children.set('backend-5000', startServer(5000, 'backend-5000'));
children.set('backend-5001', startServer(5001, 'backend-5001'));

const shutdown = () => {
    shuttingDown = true;
    for (const child of children.values()) {
        if (!child.killed) child.kill('SIGINT');
    }
    setTimeout(() => process.exit(0), 200);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
