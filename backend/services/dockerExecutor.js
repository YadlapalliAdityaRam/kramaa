const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const containerPool = require('./containerPool');
const fs = require('fs');
const path = require('path');
const {
    buildCFunctionContract,
    validateCUserCode,
    generateCDriverCode
} = require('../utils/cLeetCodeDriver');

class DockerExecutor {
    _extractJsonArrayCandidates(raw) {
        const candidates = [];
        const seen = new Set();
        const pushUnique = (value) => {
            if (!value || seen.has(value)) return;
            seen.add(value);
            candidates.push(value);
        };

        pushUnique(raw);

        const firstArrayStart = raw.indexOf('[');
        const lastArrayEnd = raw.lastIndexOf(']');
        if (firstArrayStart !== -1 && lastArrayEnd > firstArrayStart) {
            pushUnique(raw.slice(firstArrayStart, lastArrayEnd + 1));
        }

        const maxStarts = 20;
        let startsSeen = 0;
        for (let start = 0; start < raw.length && startsSeen < maxStarts; start++) {
            if (raw[start] !== '[') continue;
            startsSeen += 1;

            let depth = 0;
            let inString = false;
            let isEscaped = false;

            for (let end = start; end < raw.length; end++) {
                const ch = raw[end];
                if (inString) {
                    if (isEscaped) isEscaped = false;
                    else if (ch === '\\') isEscaped = true;
                    else if (ch === '"') inString = false;
                    continue;
                }

                if (ch === '"') {
                    inString = true;
                    continue;
                }

                if (ch === '[') depth += 1;
                if (ch === ']') {
                    depth -= 1;
                    if (depth === 0) {
                        pushUnique(raw.slice(start, end + 1));
                        break;
                    }
                }
            }
        }

        return candidates;
    }

    _parseDriverResults(stdout) {
        if (typeof stdout !== 'string') return null;
        const raw = stdout.trim();
        if (!raw) return null;

        const candidates = this._extractJsonArrayCandidates(raw);
        for (const candidate of candidates) {
            try {
                const parsed = JSON.parse(candidate);
                if (Array.isArray(parsed)) return parsed;
            } catch {
                // Try next candidate.
            }
        }

        return null;
    }

    _applyDriverMetricFallback(results, executionMeta = {}) {
        if (!Array.isArray(results) || results.length === 0) return results;

        const totalRuntime = Number(executionMeta?.time ?? 0);
        const totalMemory = Number(executionMeta?.memory ?? 0);
        const caseCount = Math.max(1, results.length);
        const fallbackPerCaseRuntime = Number.isFinite(totalRuntime) && totalRuntime > 0
            ? totalRuntime / caseCount
            : 0;

        return results.map((entry) => {
            const item = (entry && typeof entry === 'object') ? entry : {};
            const parsedRuntime = Number(item.time ?? item.runtime ?? 0);
            const parsedMemory = Number(item.memory ?? 0);

            let nextRuntime = Number.isFinite(parsedRuntime) && parsedRuntime >= 0
                ? parsedRuntime
                : 0;
            let nextMemory = Number.isFinite(parsedMemory) && parsedMemory >= 0
                ? parsedMemory
                : 0;

            if (nextRuntime === 0 && fallbackPerCaseRuntime > 0) {
                nextRuntime = fallbackPerCaseRuntime;
            }

            if (nextMemory === 0 && Number.isFinite(totalMemory) && totalMemory > 0) {
                nextMemory = totalMemory;
            }

            return {
                ...item,
                time: Number(nextRuntime.toFixed(6)),
                memory: Number(nextMemory.toFixed(6))
            };
        });
    }

    _buildDriverOutputError(language, result, problemDetails = {}) {
        const stderr = String(result?.stderr || '').trim();
        if (stderr) return stderr;

        if (language === 'c') {
            try {
                const contract = buildCFunctionContract(problemDetails || {});
                return `C execution failed before driver output. Ensure exact signature '${contract.signature}' and return results via return statement only.`;
            } catch {
                return 'C execution failed before driver output. Ensure function signature matches the configured C contract.';
            }
        }

        if (language === 'cpp') {
            const className = problemDetails?.className || 'Solution';
            const functionName = problemDetails?.functionName || 'solve';
            return `C++ execution failed before driver output. Ensure class ${className} defines method ${functionName} with correct parameter/return types and uses return (not cout) for final answer.`;
        }

        return String(result?.stdout || '').trim() || 'Driver Output Error';
    }

    async runBatchJob(code, language, batchPayload, timeLimit, problemDetails = {}) {
        const container = await containerPool.acquire();
        if (!container) throw new Error('No available containers.');

        try {
            const driversDir = path.join(__dirname, '../drivers');
            const functionName = problemDetails.functionName || 'solve';
            const className = problemDetails.className;

            let sourceFile, driverFile, runCmd;
            const env = { ALGOVERSE_FUNCTION_NAME: functionName };
            if (className) env.ALGOVERSE_CLASS_NAME = className;
            if (Array.isArray(problemDetails.parameters) && problemDetails.parameters.length > 0) {
                env.ALGOVERSE_PARAM_NAMES = JSON.stringify(
                    problemDetails.parameters.map((p) => p?.name).filter(Boolean)
                );
            }

            switch (language) {
                case 'javascript':
                    sourceFile = 'solution.js';
                    driverFile = 'driver.js';
                    const jsDriver = fs.readFileSync(path.join(driversDir, 'javascript/driver.js'), 'utf8');
                    const classNameForExport = (className && String(className).trim().length > 0)
                        ? String(className).trim()
                        : 'Solution';
                    const jsCode = `${code}
if (typeof module !== 'undefined' && module.exports) {
    const __exports = {};
    if (typeof ${classNameForExport} !== 'undefined') __exports.${classNameForExport} = ${classNameForExport};
    if (typeof ${functionName} !== 'undefined') __exports.${functionName} = ${functionName};
    module.exports = __exports;
}`;

                    await this._writeToContainer(container.id, sourceFile, jsCode);
                    await this._writeToContainer(container.id, driverFile, jsDriver);

                    runCmd = `node driver.js`;
                    break;

                case 'python':
                    sourceFile = 'solution.py';
                    driverFile = 'driver.py';
                    const pyDriver = fs.readFileSync(path.join(driversDir, 'python/driver.py'), 'utf8');

                    await this._writeToContainer(container.id, sourceFile, code);
                    await this._writeToContainer(container.id, driverFile, pyDriver);

                    runCmd = `python3 driver.py`;
                    break;

                case 'cpp':
                    sourceFile = 'solution.cpp';
                    driverFile = 'driver.cpp';
                    const cppDriver = fs.readFileSync(path.join(driversDir, 'cpp/driver.cpp'), 'utf8');

                    await this._writeToContainer(container.id, sourceFile, code);
                    await this._writeToContainer(container.id, driverFile, cppDriver);

                    // Compile
                    const compileCmd = `g++ -std=c++17 -o app driver.cpp -D FUNC_NAME=${functionName}`;
                    const compileRes = await this._spawnDockerExec(container.id, compileCmd, '', 5000);
                    if (compileRes.status !== 'accepted' && compileRes.status !== 'error') { // 'error' status in spawn means docker fail, not exit code
                        // If exit code != 0, it comes as runtime_error in my simplistic spawn?
                        // Wait, _spawnDockerExec returns 'runtime_error' for code != 0.
                        if (compileRes.status !== 'accepted') {
                            return {
                                status: 'error',
                                stderr: `Compilation Error:\n${compileRes.stderr || 'Unknown error'}`,
                                stdout: ''
                            };
                        }
                    }
                    // Actually, I should check stderr or status more carefully.
                    if (compileRes.status !== 'accepted') {
                        return { status: 'error', stderr: `Compilation Error:\n${compileRes.stderr}` };
                    }

                    runCmd = `./app`;
                    break;
                case 'c':
                    sourceFile = 'solution.c';
                    driverFile = 'driver.c';
                    try {
                        const cContract = buildCFunctionContract(problemDetails || {});
                        const cSignatureCheck = validateCUserCode(code, cContract);
                        if (!cSignatureCheck.valid) {
                            return { status: 'error', stderr: `Compilation Error:\n${cSignatureCheck.error}` };
                        }

                        let parsedInputs = [];
                        try {
                            const decoded = JSON.parse(batchPayload || '[]');
                            parsedInputs = Array.isArray(decoded) ? decoded : [];
                        } catch {
                            parsedInputs = [];
                        }

                        const cDriver = generateCDriverCode(problemDetails || {}, parsedInputs);
                        await this._writeToContainer(container.id, sourceFile, code);
                        await this._writeToContainer(container.id, driverFile, cDriver);
                    } catch (error) {
                        return { status: 'error', stderr: `Compilation Error:\n${error.message}` };
                    }

                    {
                        const compileCmd = `gcc -std=c11 -O2 -Wall -Werror -o app driver.c solution.c`;
                        const compileRes = await this._spawnDockerExec(container.id, compileCmd, '', 5000);
                        if (compileRes.status !== 'accepted') {
                            return { status: 'error', stderr: `Compilation Error:\n${compileRes.stderr}` };
                        }
                    }

                    runCmd = `./app`;
                    break;

                default:
                    throw new Error(`Docker execution for ${language} not yet implemented.`);
            }

            // 2. Execute Batch
            const runInput = language === 'c' ? '' : batchPayload;
            const result = await this._spawnDockerExec(container.id, runCmd, runInput, timeLimit, env);

            // 3. Parse Output
            if (result.status === 'accepted' || result.status === 'runtime_error') {
                const parsed = this._parseDriverResults(result.stdout);
                if (parsed) {
                    return this._applyDriverMetricFallback(parsed, {
                        time: result.time,
                        memory: result.memory
                    });
                }

                return {
                    stderr: this._buildDriverOutputError(language, result, problemDetails),
                    status: 'error'
                };
            }
            return result;

        } catch (error) {
            console.error('Docker Batch Error:', error);
            return { status: 'error', stderr: error.message };
        } finally {
            await containerPool.release(container.id);
        }
    }

    async _writeToContainer(containerId, filename, content) {
        return new Promise((resolve, reject) => {
            const { spawn } = require('child_process');
            const child = spawn('docker', ['exec', '-i', containerId, 'sh', '-c', `cat > ${filename}`]);
            child.stdin.write(content);
            child.stdin.end();
            child.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`Failed to write ${filename} to container`));
            });
            child.on('error', reject);
        });
    }

    async execute(command, language, input = '', timeLimit = 2000) {
        // 1. Acquire Container
        const container = await containerPool.acquire();
        if (!container) {
            throw new Error('No available containers in pool. Please try again later.');
        }

        try {
            // 2. Prepare Command
            // Use time command inside container for accurate measurement
            // timeout command to enforce limits
            const timeoutCmd = `timeout ${timeLimit / 1000}s`;

            // Execute command inside container
            // We need to pass input via stdin?
            // "docker exec -i" allows stdin

            const fullCmd = `docker exec -i ${container.id} sh -c "${command}"`;

            const start = process.hrtime.bigint();

            const { stdout, stderr } = await execPromise(fullCmd, {
                input: input, // Pass input to docker exec stdin? execPromise doesn't support 'input' option directly easily for child_process.exec
                // We need spawn for stdin handling or write strictly.
                // Let's use spawn for better control
            });
            // Actually execPromise is simple wrapper. Let's use spawn for better stream control if needed.
            // implementation detail: allow input mapping.

            // Re-implement with spawn for input stream
            const result = await this._spawnDockerExec(container.id, command, input, timeLimit);

            return result;

        } catch (error) {
            return {
                status: 'error',
                stderr: error.stderr || error.message,
                stdout: error.stdout || '',
                time: 0,
                memory: 0
            };
        } finally {
            // 3. Release Container
            await containerPool.release(container.id);
        }
    }

    _spawnDockerExec(containerId, command, input, timeLimit, extraEnv = {}) {
        return new Promise((resolve) => {
            const { spawn } = require('child_process');

            const envArgs = [];
            Object.entries(extraEnv || {}).forEach(([key, value]) => {
                envArgs.push('-e', `${key}=${value}`);
            });

            const child = spawn('docker', ['exec', '-i', ...envArgs, containerId, 'sh', '-c', command]);

            let stdout = '';
            let stderr = '';
            let start = process.hrtime.bigint();
            let completed = false;
            const timeoutMs = Number.isFinite(Number(timeLimit)) ? Math.max(1, Number(timeLimit)) : 2000;

            if (input) {
                child.stdin.write(input);
                child.stdin.end();
            }

            child.stdout.on('data', (data) => stdout += data.toString());
            child.stderr.on('data', (data) => stderr += data.toString());

            const timeoutId = setTimeout(() => {
                if (completed) return;
                completed = true;
                try {
                    child.kill();
                } catch {
                    // ignore
                }

                const end = process.hrtime.bigint();
                const timeMs = Number(end - start) / 1e6;
                resolve({
                    stdout,
                    stderr: 'Time Limit Exceeded',
                    status: 'time_limit_exceeded',
                    time: timeMs.toFixed(3),
                    memory: 0
                });
            }, timeoutMs);

            child.on('close', (code) => {
                if (completed) return;
                completed = true;
                clearTimeout(timeoutId);
                const end = process.hrtime.bigint();
                const timeMs = Number(end - start) / 1e6;

                let status = 'accepted';
                if (code === 124) status = 'time_limit_exceeded'; // timeout exit code
                else if (code !== 0) status = 'runtime_error';

                resolve({
                    stdout,
                    stderr,
                    status,
                    time: timeMs.toFixed(3),
                    memory: 0 // TODO: parse from time -v or similar
                });
            });

            child.on('error', (err) => {
                if (completed) return;
                completed = true;
                clearTimeout(timeoutId);
                resolve({
                    stdout,
                    stderr: `Docker Error: ${err.message}`,
                    status: 'error',
                    time: 0,
                    memory: 0
                });
            });
        });
    }
}

module.exports = new DockerExecutor();
