const dotenv = require('dotenv');
const path = require('path');
const codeExecutor = require('../services/codeExecutor');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const tests = [
    {
        language: 'javascript',
        code: 'function solve(x) { return x; }',
        problemDetails: { functionName: 'solve', className: 'Solution', parameters: [{ name: 'x', type: 'int' }] },
        input: { x: 5 },
        expected: '5'
    },
    {
        language: 'python',
        code: 'def solve(x):\n    return x',
        problemDetails: { functionName: 'solve', className: 'Solution', parameters: [{ name: 'x', type: 'int' }] },
        input: { x: 5 },
        expected: '5'
    },
    {
        language: 'java',
        code: 'class Solution { public int solve(int x) { return x; } }',
        problemDetails: { functionName: 'solve', className: 'Solution', parameters: [{ name: 'x', type: 'int' }] },
        input: { x: 5 },
        expected: '5'
    },
    {
        language: 'cpp',
        code: 'class Solution { public: int solve(int x) { return x; } };',
        problemDetails: { functionName: 'solve', className: 'Solution', parameters: [{ name: 'x', type: 'int' }] },
        input: { x: 5 },
        expected: '5'
    },
    {
        language: 'c',
        code: '#include <string.h>\nchar* solve(char* input){ return input; }',
        problemDetails: { functionName: 'solve', parameters: [{ name: 'input', type: 'string' }] },
        input: { input: '5' },
        expected: '5'
    }
];

const normalize = (value) => String(value ?? '').trim().replace(/^"(.*)"$/, '$1');

async function run() {
    let failures = 0;
    console.log(`USE_DOCKER=${process.env.USE_DOCKER || 'false'} AUTO_DOCKER_FALLBACK=${process.env.AUTO_DOCKER_FALLBACK || 'true'}`);

    for (const test of tests) {
        const { language, code, problemDetails, input, expected } = test;
        process.stdout.write(`\n[${language}] `);
        try {
            const results = await codeExecutor.executeBatch(
                code,
                language,
                [{ input }],
                3000,
                problemDetails
            );

            const first = Array.isArray(results) ? results[0] : null;
            if (!first) {
                failures += 1;
                console.log('FAIL (no execution result)');
                continue;
            }

            const stderr = normalize(first.stderr);
            const stdout = normalize(first.stdout);
            if (stderr) {
                failures += 1;
                console.log(`FAIL (${stderr})`);
                continue;
            }

            if (stdout !== expected) {
                failures += 1;
                console.log(`FAIL (expected ${expected}, got ${stdout || '<empty>'})`);
                continue;
            }

            console.log('OK');
        } catch (error) {
            failures += 1;
            console.log(`FAIL (${error.message || String(error)})`);
        }
    }

    if (failures > 0) {
        console.error(`\nLanguage stack check failed for ${failures} language(s).`);
        process.exit(1);
    }

    console.log('\nAll language runtimes are healthy.');
    process.exit(0);
}

run();
