const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { spawn, exec } = require('child_process');
const dockerExecutor = require('./dockerExecutor');
const containerPool = require('./containerPool');
const {
    buildCFunctionContract,
    validateCUserCode,
    generateCDriverCode
} = require('../utils/cLeetCodeDriver');
const {
    resolveTypeSpec,
    getValidatorForSpec,
    normalizeTypeName
} = require('../utils/typeRegistry');
const {
    parseExecutionValue,
    validateOutputByRule,
    normalizeOutputValidationType
} = require('../utils/outputValidation');

class CodeExecutor {
    constructor() {
        this.apiUrl = process.env.JUDGE0_API_URL;
        this.apiKey = process.env.JUDGE0_API_KEY;

        this.languageIds = {
            javascript: 63,
            python: 71,
            java: 62,
            cpp: 54,
            c: 50
        };

        // Compiler paths (rely on system PATH by default except Java)
        this.compilerPaths = {
            javac: process.env.JAVAC_PATH || 'javac',
            java: process.env.JAVA_PATH || 'java',
            gpp: 'g++',
            gcc: 'gcc'
        };

        this.tmpDir = path.join(__dirname, '../tmp');
        this.driversDir = path.join(__dirname, '../drivers');
        const parsedJavaHeap = Number.parseInt(process.env.JAVA_HEAP_MB || '128', 10);
        this.javaHeapMb = Number.isFinite(parsedJavaHeap)
            ? Math.min(512, Math.max(64, parsedJavaHeap))
            : 128;
        this.javaMinHeapMb = Math.min(32, this.javaHeapMb);

        this.supportedLanguages = ['javascript', 'python', 'java', 'cpp', 'c'];
        this._commandAvailabilityCache = new Map();
        this._commandAvailabilityTtlMs = 60 * 1000;
        this._dockerReadyCache = { checkedAt: 0, ready: false };
        this._dockerReadyTtlMs = 60 * 1000;
        this._dockerPoolInitialized = false;
    }

    _normalizeCommand(command) {
        return String(command || '').trim().replace(/^"(.*)"$/, '$1');
    }

    _isPathLikeCommand(command) {
        const normalized = this._normalizeCommand(command);
        return normalized.includes('/') || normalized.includes('\\');
    }

    _execShell(command, cwd = undefined) {
        return new Promise((resolve, reject) => {
            exec(command, { cwd }, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error((stderr || stdout || error.message || 'Command failed').trim()));
                    return;
                }
                resolve({ stdout: String(stdout || ''), stderr: String(stderr || '') });
            });
        });
    }

    async _isCommandAvailable(command) {
        const normalized = this._normalizeCommand(command);
        if (!normalized) return false;

        const now = Date.now();
        const cached = this._commandAvailabilityCache.get(normalized);
        if (cached && (now - cached.checkedAt) < this._commandAvailabilityTtlMs) {
            return cached.available;
        }

        let available = false;
        try {
            if (this._isPathLikeCommand(normalized)) {
                available = await fs.pathExists(normalized);
            } else {
                const probeCmd = process.platform === 'win32'
                    ? `where.exe ${normalized}`
                    : `command -v ${normalized}`;
                await this._execShell(probeCmd);
                available = true;
            }
        } catch {
            available = false;
        }

        this._commandAvailabilityCache.set(normalized, {
            available,
            checkedAt: now
        });
        return available;
    }

    _getRequiredCommandGroupsForLanguage(language) {
        const isWin = process.platform === 'win32';
        switch (language) {
            case 'javascript':
                return [{ label: 'node', commands: ['node'] }];
            case 'python':
                return isWin
                    ? [{ label: 'python', commands: ['py', 'python', 'python3'] }]
                    : [{ label: 'python3', commands: ['python3'] }];
            case 'java':
                return [
                    { label: this._normalizeCommand(this.compilerPaths.javac), commands: [this.compilerPaths.javac] },
                    { label: this._normalizeCommand(this.compilerPaths.java), commands: [this.compilerPaths.java] }
                ];
            case 'cpp':
                return [{ label: this._normalizeCommand(this.compilerPaths.gpp), commands: [this.compilerPaths.gpp] }];
            case 'c':
                return [{ label: this._normalizeCommand(this.compilerPaths.gcc), commands: [this.compilerPaths.gcc] }];
            default:
                return [];
        }
    }

    async _getMissingLocalDependencies(language) {
        const groups = this._getRequiredCommandGroupsForLanguage(language);
        const missing = [];
        for (const group of groups) {
            let found = false;
            const commandOptions = Array.isArray(group?.commands) ? group.commands : [];
            for (const cmd of commandOptions) {
                // eslint-disable-next-line no-await-in-loop
                const present = await this._isCommandAvailable(cmd);
                if (present) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                missing.push(group?.label || this._normalizeCommand(commandOptions[0] || 'unknown'));
            }
        }
        return missing;
    }

    async _isDockerReady() {
        const now = Date.now();
        if ((now - this._dockerReadyCache.checkedAt) < this._dockerReadyTtlMs) {
            return this._dockerReadyCache.ready;
        }

        let ready = false;
        try {
            await this._execShell('docker --version');
            await this._execShell(`docker inspect --type=image ${containerPool.imageName}`);
            ready = true;
        } catch {
            ready = false;
        }

        this._dockerReadyCache = { checkedAt: now, ready };
        return ready;
    }

    _buildMissingDependencyMessage(language, missingCommands = []) {
        const tools = missingCommands.length > 0
            ? missingCommands.join(', ')
            : 'required language runtime/compiler';
        return `Execution environment missing required tool(s): ${tools}. Configure runtime dependencies for ${language} or enable Docker executor with image '${containerPool.imageName}'.`;
    }

    _getJavaCompileFlags() {
        return `-J-Xms${this.javaMinHeapMb}m -J-Xmx${this.javaHeapMb}m -J-XX:+UseSerialGC`;
    }

    _getJavaRuntimeArgs(mainClass) {
        return [
            `-Xms${this.javaMinHeapMb}m`,
            `-Xmx${this.javaHeapMb}m`,
            '-XX:+UseSerialGC',
            mainClass
        ];
    }

    _extractMissingCommandFromShellError(message) {
        const text = String(message || '').trim();
        if (!text) return null;

        // Linux shell: "/bin/sh: 1: javac: not found"
        let match = text.match(/(?:^|\/bin\/sh:\s*\d+:\s*)([a-zA-Z0-9+_.-]+):\s*not found/i);
        if (match && match[1]) return match[1];

        // Windows shell: "'javac' is not recognized as an internal or external command"
        match = text.match(/'([^']+)'\s+is not recognized as an internal or external command/i);
        if (match && match[1]) return match[1];

        // Spawn error: "spawn javac ENOENT"
        match = text.match(/spawn\s+([a-zA-Z0-9+_.-]+)\s+ENOENT/i);
        if (match && match[1]) return match[1];

        return null;
    }

    _buildBatchEnvironmentErrors(testCases, language, missingCommands = []) {
        const message = this._buildMissingDependencyMessage(language, missingCommands);
        return testCases.map(() => ({
            stdout: '',
            stderr: message,
            printedOutput: '',
            returnMissing: false,
            time: 0,
            memory: 0,
            status: 'error',
            rawOutput: ''
        }));
    }

    async _tryDockerBatchFallback(code, language, batchPayload, timeLimit, problemDetails, testCases) {
        const dockerFallbackEnabled = String(process.env.AUTO_DOCKER_FALLBACK || 'true').toLowerCase() !== 'false';
        if (!dockerFallbackEnabled) return null;
        if (!this.supportedLanguages.includes(language)) return null;

        const dockerReady = await this._isDockerReady();
        if (!dockerReady) return null;

        try {
            if (!this._dockerPoolInitialized) {
                await containerPool.initialize();
                this._dockerPoolInitialized = true;
            }
            return await dockerExecutor.runBatchJob(code, language, batchPayload, timeLimit, problemDetails);
        } catch (error) {
            return this._buildBatchEnvironmentErrors(
                testCases,
                language,
                [`docker (${error.message || 'initialization failed'})`]
            );
        }
    }

    async executeCode(code, language, input = '', timeLimit = 2000, problemDetails = {}) {
        if (process.env.USE_DOCKER === 'true' && ['javascript', 'python', 'java', 'cpp', 'c'].includes(language)) {
            // For single execution, we just run the batch of 1
            // We need to decide if we want to return raw result or parsed
            // The driver will return a JSON array loop output.
            // We need to parse it to match expected single output format?
            // Actually, executeCode is mostly used for "Run" button with 1 custom input.
            // Let's keep it simple: consume the batch logic.

            // Reuse the batch logic but expect 1 result
            const results = await this.executeBatch(code, language, [{ input }], timeLimit, problemDetails);
            if (results && results.length > 0) {
                const first = results[0] || {};
                const printedOutput = this._normalizeOutput(first.printedOutput);
                const returnMissing = Boolean(first.returnMissing);
                const stdout = printedOutput || this._normalizeOutput(first.stdout);
                const stderr = this._normalizeOutput(first.stderr);
                const status = first.status || (stderr ? 'runtime_error' : 'accepted');

                return {
                    stdout,
                    stderr,
                    status,
                    time: first.time,
                    memory: first.memory,
                    printedOutput,
                    returnMissing
                };
            }
            return { status: 'error', stderr: 'No result returned' };
        }

        // Fallback or Local
        if (['javascript', 'python', 'java', 'cpp', 'c'].includes(language)) {
            // We use executeLocally but we need to update it to support batch or wrap
            // For now, let's Redirect to executeBatch even for local to enforce uniformity
            const results = await this.executeBatch(code, language, [{ input }], timeLimit, problemDetails);
            if (results && results.length > 0) {
                const res = results[0] || {};
                const printedOutput = this._normalizeOutput(res.printedOutput);
                const returnMissing = Boolean(res.returnMissing);
                const stdout = printedOutput || this._normalizeOutput(res.stdout);
                const stderr = this._normalizeOutput(res.stderr);
                const status = res.status || (stderr ? 'runtime_error' : 'accepted');

                return {
                    stdout,
                    stderr,
                    status,
                    time: res.time,
                    memory: res.memory,
                    printedOutput,
                    returnMissing
                };
            }
            return { status: 'error', stderr: 'Local execution failed' };
        }

        // ... judge0 ...
        return { status: 'error', stderr: 'Judge0 fallback not fully implemented in this version.' };
    }

    async executeLocally(code, language, input, timeLimit, problemDetails) {
        const jobId = uuidv4();
        const jobDir = path.join(this.tmpDir, jobId);
        await fs.ensureDir(jobDir);

        const functionName = problemDetails.functionName || 'solve';
        const className = problemDetails.className || 'Solution';
        const isScript = problemDetails.mode === 'script'; // New flag for Generator/Script execution

        // Static Analysis: Intercept and reject forbidden IO/system calls
        if (!isScript && language !== 'c') {
            // For languages like Python, intercept reading from stdin directly. We also block `open`, `os`, `exec`
            const forbiddenPatterns = ['input(', 'sys.stdin', 'os.', 'subprocess.', 'eval(', 'exec(', 'open('];
            for (const pattern of forbiddenPatterns) {
                if (code.includes(pattern)) {
                    return {
                        status: 'error',
                        stdout: '',
                        stderr: `Security Error: Direct system/IO operations are not allowed. Usage of '${pattern}' is forbidden.\nPlease pass data via function parameters.`,
                        time: 0,
                        memory: 0
                    };
                }
            }
        }

        try {
            // 1. Write User Code
            const userFile = this._getUserFileName(language);
            let finalCode = code;
            if (language === 'javascript' && !isScript) {
                const classNameForExport = (className && String(className).trim().length > 0)
                    ? String(className).trim()
                    : 'Solution';
                finalCode += `
if (typeof module !== 'undefined' && module.exports) {
    const __exports = {};
    if (typeof ${classNameForExport} !== 'undefined') __exports.${classNameForExport} = ${classNameForExport};
    if (typeof ${functionName} !== 'undefined') __exports.${functionName} = ${functionName};
    module.exports = __exports;
}`;
            }
            await fs.writeFile(path.join(jobDir, userFile), finalCode);

            // 2. Prepare Driver (Copy + Compile)
            if (isScript) {
                await this._prepareScript(language, jobDir, userFile);
            } else {
                await this._prepareDriver(language, jobDir, functionName);
            }

            // 3. Execute
            const paramNames = Array.isArray(problemDetails.parameters)
                ? problemDetails.parameters.map((p) => p?.name).filter(Boolean)
                : [];
            const result = await this._execute(language, jobDir, input, functionName, timeLimit, isScript, className, paramNames);

            // Cleanup
            await this._cleanup(jobDir);

            return result;
        } catch (error) {
            await this._cleanup(jobDir);
            return {
                status: 'error',
                stdout: '',
                stderr: `Execution Error: ${error.message}`,
                time: 0,
                memory: 0
            };
        }
    }

    _getUserFileName(language) {
        switch (language) {
            case 'javascript': return 'solution.js';
            case 'python': return 'solution.py';
            case 'java': return 'Solution.java';
            case 'cpp': return 'solution.cpp';
            case 'c': return 'solution.c';
            default: throw new Error(`Unsupported language: ${language}`);
        }
    }

    async _prepareDriver(language, jobDir, functionName) {
        const driversDir = this.driversDir;

        switch (language) {
            case 'javascript':
                await fs.copyFile(path.join(driversDir, 'javascript/driver.js'), path.join(jobDir, 'driver.js'));
                break;
            case 'python':
                await fs.copyFile(path.join(driversDir, 'python/driver.py'), path.join(jobDir, 'driver.py'));
                break;
            case 'java':
                await fs.copyFile(path.join(driversDir, 'java/Driver.java'), path.join(jobDir, 'Driver.java'));
                try {
                    // Compile both Driver.java and Solution.java
                    await this._runCommand(
                        `"${this.compilerPaths.javac}" ${this._getJavaCompileFlags()} Driver.java Solution.java`,
                        jobDir
                    );
                } catch (e) {
                    throw new Error(`Compilation Error:\n${e.message}`);
                }
                break;
            case 'cpp':
                await fs.copyFile(path.join(driversDir, 'cpp/driver.cpp'), path.join(jobDir, 'driver.cpp'));
                try {
                    // Compile only driver.cpp (which includes solution.cpp) to avoid duplicate symbols or missing class def errors.
                    // Inject FUNC_NAME macro for dynamic method call.
                    const cppLinkFlags = process.platform === 'win32' ? ' -lpsapi' : '';
                    const cmd = `"${this.compilerPaths.gpp}" -std=c++17 -o app driver.cpp -DFUNC_NAME=${functionName}${cppLinkFlags}`;
                    await this._runCommand(cmd, jobDir);
                } catch (e) {
                    throw new Error(`Compilation Error:\n${e.message}`);
                }
                break;
            case 'c':
                await fs.copyFile(path.join(driversDir, 'c/driver.c'), path.join(jobDir, 'driver.c'));
                try {
                    const cLinkFlags = process.platform === 'win32' ? ' -lpsapi' : '';
                    const cmd = `"${this.compilerPaths.gcc}" -std=c11 -O2 -Wall -Werror -o app driver.c solution.c -DFUNC_NAME=${functionName}${cLinkFlags}`;
                    await this._runCommand(cmd, jobDir);
                } catch (e) {
                    throw new Error(`Compilation Error:\n${e.message}`);
                }
                break;
        }
    }

    // New method for compiling/preparing scripts (Generators)
    async _prepareScript(language, jobDir, userFile) {
        switch (language) {
            case 'java':
                try {
                    await this._runCommand(
                        `"${this.compilerPaths.javac}" ${this._getJavaCompileFlags()} ${userFile}`,
                        jobDir
                    );
                } catch (e) {
                    throw new Error(`Compilation Error:\n${e.message}`);
                }
                break;
            case 'cpp':
                try {
                    const cmd = `"${this.compilerPaths.gpp}" -o app ${userFile}`;
                    await this._runCommand(cmd, jobDir);
                } catch (e) {
                    throw new Error(`Compilation Error:\n${e.message}`);
                }
                break;
            case 'c':
                try {
                    const cmd = `"${this.compilerPaths.gcc}" -o app ${userFile}`;
                    await this._runCommand(cmd, jobDir);
                } catch (e) {
                    throw new Error(`Compilation Error:\n${e.message}`);
                }
                break;
            case 'javascript':
            case 'python':
                // No compilation needed
                break;
        }
    }

    async _execute(language, jobDir, input, functionName, timeLimit, isScript = false, className = null, paramNames = []) {
        let command;
        let args = [];
        const env = { ...process.env };
        if (!isScript) {
            env.ALGOVERSE_FUNCTION_NAME = functionName;
            if (className) {
                env.ALGOVERSE_CLASS_NAME = className;
            }
            if (Array.isArray(paramNames) && paramNames.length > 0) {
                env.ALGOVERSE_PARAM_NAMES = JSON.stringify(paramNames);
            }
        }
        const isWin = process.platform === 'win32';

        if (isScript) {
            switch (language) {
                case 'javascript':
                    command = 'node';
                    args = ['solution.js'];
                    break;
                case 'python':
                    command = isWin ? 'py' : 'python3';
                    args = ['solution.py'];
                    break;
                case 'java':
                    command = this.compilerPaths.java;
                    args = this._getJavaRuntimeArgs('Solution'); // Assumes class is named Solution
                    break;
                case 'cpp':
                case 'c':
                    command = isWin ? 'app.exe' : './app';
                    break;
            }
        } else {
            // Existing logic for Driver execution
            switch (language) {
                case 'javascript':
                    command = 'node';
                    args = ['driver.js'];
                    break;
                case 'python':
                    command = isWin ? 'py' : 'python3';
                    args = ['driver.py'];
                    break;
                case 'java':
                    command = this.compilerPaths.java;
                    args = this._getJavaRuntimeArgs('Driver');
                    break;
                case 'cpp':
                case 'c':
                    command = isWin ? 'app.exe' : './app';
                    break;
            }
        }

        return new Promise((resolve) => {
            const start = process.hrtime.bigint();
            const child = spawn(command, args, {
                cwd: jobDir,
                env: env,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            // Write input to stdin
            if (input) {
                child.stdin.write(input);
            }
            child.stdin.end();

            child.stdout.on('data', (data) => stdout += data.toString());
            child.stderr.on('data', (data) => stderr += data.toString());

            let timeoutId;
            let isResolved = false;

            const cleanup = () => {
                if (timeoutId) clearTimeout(timeoutId);
            };

            child.on('error', (err) => {
                if (isResolved) return;
                isResolved = true;
                cleanup();
                const missingTool = this._extractMissingCommandFromShellError(err?.message);
                resolve({
                    stdout: stdout,
                    stderr: missingTool
                        ? this._buildMissingDependencyMessage(language, [missingTool])
                        : `Process Error: ${err.message}`,
                    status: 'error',
                    time: 0,
                    memory: 0
                });
            });

            child.on('close', (code, signal) => {
                if (isResolved) return;
                isResolved = true;
                cleanup();

                const end = process.hrtime.bigint();
                const runtimeMs = Number(end - start) / 1e6; // Convert ns to ms

                // Child peak memory is reported by language drivers when available.
                // Keep process-level fallback deterministic (0) rather than synthetic values.
                const memory = 0;

                let status = 'accepted';
                if (code !== 0) {
                    status = 'runtime_error';
                }

                let effectiveStderr = stderr;
                if (status === 'runtime_error' && !String(effectiveStderr || '').trim()) {
                    if (signal) {
                        effectiveStderr = `Runtime Error: Process terminated by signal ${signal}.`;
                    } else {
                        effectiveStderr = `Runtime Error: Process exited with code ${code}.`;
                    }
                }

                resolve({
                    stdout,
                    stderr: effectiveStderr,
                    status,
                    time: runtimeMs.toFixed(3),
                    memory: memory.toFixed(3),
                    exitCode: code,
                    signal: signal || null
                });
            });

            // Timeout
            timeoutId = setTimeout(() => {
                if (isResolved) return;
                isResolved = true;
                try {
                    child.kill();
                } catch (e) { }

                resolve({
                    stdout: stdout,
                    stderr: 'Time Limit Exceeded',
                    status: 'time_limit_exceeded',
                    time: timeLimit,
                    memory: 0
                });
            }, timeLimit);
        });
    }

    _runCommand(command, cwd) {
        return new Promise((resolve, reject) => {
            exec(command, { cwd }, (error, stdout, stderr) => {
                if (error) {
                    const combined = String(stderr || stdout || error.message || '').trim();
                    const missingTool = this._extractMissingCommandFromShellError(combined);
                    if (missingTool) {
                        reject(new Error(this._buildMissingDependencyMessage('execution', [missingTool])));
                        return;
                    }
                    reject(new Error(combined));
                } else {
                    resolve(stdout);
                }
            });
        });
    }

    async _cleanup(jobDir) {
        try {
            await new Promise(r => setTimeout(r, 100));
            await fs.remove(jobDir);
        } catch (e) {
            console.error('Cleanup error:', e.message);
        }
    }

    formatResult(rawResult) {
        return {
            stdout: rawResult.stdout ? Buffer.from(rawResult.stdout, 'base64').toString() : '',
            stderr: rawResult.stderr ? Buffer.from(rawResult.stderr, 'base64').toString() : '',
            compile_output: rawResult.compile_output ? Buffer.from(rawResult.compile_output, 'base64').toString() : '',
            status: rawResult.status.description.toLowerCase().replace(' ', '_'),
            time: rawResult.time,
            memory: rawResult.memory
        };
    }

    _normalizeOutput(value) {
        if (value === null || value === undefined) return '';
        let str = String(value).replace(/\r\n/g, '\n').trim();

        // Strip surrounding quotes so "hello" == hello during verification
        if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
            if (str.length >= 2) {
                str = str.slice(1, -1);
            }
        }
        return str;
    }

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
                    if (isEscaped) {
                        isEscaped = false;
                    } else if (ch === '\\') {
                        isEscaped = true;
                    } else if (ch === '"') {
                        inString = false;
                    }
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
            } catch (error) {
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
        const stderr = this._normalizeOutput(result?.stderr);
        if (stderr) return stderr;

        const signal = this._normalizeOutput(result?.signal);
        if (signal) {
            return `Runtime Error: Process terminated by signal ${signal}.`;
        }

        const exitCode = Number(result?.exitCode);
        if (Number.isInteger(exitCode) && exitCode !== 0) {
            return `Runtime Error: Process exited with code ${exitCode}.`;
        }

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

        return 'Driver Output Error';
    }

    async _executeLeetStyleCBatchLocally(code, inputs, timeLimit, problemDetails) {
        const jobId = uuidv4();
        const jobDir = path.join(this.tmpDir, jobId);
        await fs.ensureDir(jobDir);

        try {
            const contract = buildCFunctionContract(problemDetails || {});
            const signatureCheck = validateCUserCode(code, contract);
            if (!signatureCheck.valid) {
                return {
                    status: 'error',
                    stdout: '',
                    stderr: `Compilation Error:\n${signatureCheck.error}`,
                    time: 0,
                    memory: 0
                };
            }

            await fs.writeFile(path.join(jobDir, 'solution.c'), code);
            const driverCode = generateCDriverCode(problemDetails || {}, inputs || []);
            await fs.writeFile(path.join(jobDir, 'driver.c'), driverCode);

            const cLinkFlags = process.platform === 'win32' ? ' -lpsapi' : '';
            const compileCmd = `"${this.compilerPaths.gcc}" -std=c11 -O2 -Wall -Werror -o app driver.c solution.c${cLinkFlags}`;
            await this._runCommand(compileCmd, jobDir);

            const executionResult = await this._execute(
                'c',
                jobDir,
                '',
                problemDetails?.functionName || 'solve',
                timeLimit,
                false,
                null,
                []
            );

            return executionResult;
        } catch (error) {
            return {
                status: 'error',
                stdout: '',
                stderr: `Compilation Error:\n${error.message}`,
                time: 0,
                memory: 0
            };
        } finally {
            await this._cleanup(jobDir);
        }
    }

    _validateInputAgainstParameters(inputObj, parameters) {
        if (!parameters || parameters.length === 0) return true;

        if (!inputObj || typeof inputObj !== 'object' || Array.isArray(inputObj)) {
            return false;
        }

        const expectedNames = new Set();

        for (const param of parameters) {
            const expectedName = String(param?.name || '').trim();
            if (!expectedName) return false;
            expectedNames.add(expectedName);

            const typeInfo = resolveTypeSpec(param?.type || '');
            const depth = param?.is2D ? 2 : (param?.isArray ? 1 : typeInfo.depth);
            const spec = {
                baseType: normalizeTypeName(typeInfo.baseType),
                depth
            };

            const validator = getValidatorForSpec(spec);
            if (!validator) return false;

            const val = inputObj[expectedName];

            if (val === undefined) return false;

            if (!validator(val)) {
                return false;
            }
        }

        const inputKeys = Object.keys(inputObj);
        for (const key of inputKeys) {
            if (!expectedNames.has(key)) return false;
        }

        return true;
    }

    _decodeEscapedStringValue(value) {
        if (typeof value !== 'string') return value;

        let current = value;
        for (let i = 0; i < 6; i++) {
            let changed = false;

            const trimmed = current.trim();
            if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (typeof parsed === 'string' && parsed !== current) {
                        current = parsed;
                        changed = true;
                    }
                } catch {
                    // Keep current string when JSON parsing fails.
                }
            }

            if (!changed && current.includes('\\"')) {
                const unescaped = current.replace(/\\"/g, '"');
                if (unescaped !== current) {
                    current = unescaped;
                    changed = true;
                }
            }

            if (!changed) break;
        }

        return current;
    }

    _decodeMaybeJsonCollection(value) {
        if (typeof value !== 'string') return value;

        let current = value;
        for (let i = 0; i < 4; i++) {
            if (typeof current !== 'string') break;
            const trimmed = current.trim();
            if (!trimmed) break;

            const looksJson =
                (trimmed.startsWith('[') && trimmed.endsWith(']'))
                || (trimmed.startsWith('{') && trimmed.endsWith('}'))
                || (trimmed.startsWith('"') && trimmed.endsWith('"'));

            if (!looksJson) break;

            try {
                const parsed = JSON.parse(trimmed);
                if (parsed === current) break;
                current = parsed;
            } catch {
                break;
            }
        }

        return current;
    }

    _normalizeInputValueForParameter(value, parameterMeta) {
        const paramType = String(parameterMeta?.type || '').toLowerCase();
        const isStringLike = paramType === 'string' || paramType === 'char';

        if (parameterMeta?.is2D) {
            let normalizedValue = typeof value === 'string'
                ? this._decodeMaybeJsonCollection(value)
                : value;

            if (!Array.isArray(normalizedValue)) return normalizedValue;
            return normalizedValue.map((row) => {
                if (!Array.isArray(row)) return row;
                return row.map((item) => (isStringLike ? this._decodeEscapedStringValue(item) : item));
            });
        }

        if (parameterMeta?.isArray) {
            let normalizedValue = typeof value === 'string'
                ? this._decodeMaybeJsonCollection(value)
                : value;

            if (
                Array.isArray(normalizedValue)
                && normalizedValue.length === 1
                && typeof normalizedValue[0] === 'string'
            ) {
                const decodedInner = this._decodeMaybeJsonCollection(normalizedValue[0]);
                if (Array.isArray(decodedInner)) {
                    normalizedValue = decodedInner;
                }
            }

            if (!Array.isArray(normalizedValue)) return normalizedValue;
            return normalizedValue.map((item) => (isStringLike ? this._decodeEscapedStringValue(item) : item));
        }

        if (isStringLike) {
            return this._decodeEscapedStringValue(value);
        }

        return value;
    }

    _normalizeInputAgainstParameters(inputObj, parameters) {
        if (!parameters || parameters.length === 0) return inputObj;
        if (!inputObj || typeof inputObj !== 'object' || Array.isArray(inputObj)) return inputObj;

        const normalized = { ...inputObj };
        for (const param of parameters) {
            if (Object.prototype.hasOwnProperty.call(normalized, param.name)) {
                normalized[param.name] = this._normalizeInputValueForParameter(normalized[param.name], param);
            }
        }
        return normalized;
    }

    // Unified Batch Execution (Local + Docker)
    async executeBatch(code, language, testCases, timeLimit, problemDetails) {
        const parameters = problemDetails?.parameters || [];

        // Input payload must already be structured JSON types.
        const inputs = testCases.map((tc) => {
            let parsedInput;
            try {
                parsedInput = typeof tc.input === 'string' ? JSON.parse(tc.input) : tc.input;
            } catch {
                parsedInput = tc.input;
            }

            // Auto-wrap legacy formats into {paramName: value} objects
            if (parameters.length > 0) {
                if (parsedInput === null || typeof parsedInput !== 'object' || Array.isArray(parsedInput)) {
                    if (Array.isArray(parsedInput) && parsedInput.length === parameters.length) {
                        const wrapped = {};
                        for (let j = 0; j < parameters.length; j++) {
                            wrapped[parameters[j].name] = parsedInput[j];
                        }
                        parsedInput = wrapped;
                    } else if (parameters.length === 1) {
                        const wrapped = {};
                        wrapped[parameters[0].name] = parsedInput;
                        parsedInput = wrapped;
                    }
                }
            }

            return parsedInput;
        });

        // Enforce rigid parameter schema validation
        if (parameters.length > 0) {
            for (let i = 0; i < inputs.length; i++) {
                if (!this._validateInputAgainstParameters(inputs[i], parameters)) {
                    return testCases.map(() => ({
                        stderr: 'Test case format error: Invalid data type or structure.',
                        status: 'error',
                        rawOutput: ''
                    }));
                }
            }
        }

        const payloadInputs = inputs;

        const batchPayload = JSON.stringify(payloadInputs);

        const dockerEnabled = process.env.USE_DOCKER === 'true';

        if (dockerEnabled) {
            const dockerReady = await this._isDockerReady();
            if (dockerReady) {
                return await dockerExecutor.runBatchJob(code, language, batchPayload, timeLimit, problemDetails);
            }

            // If Docker was requested but isn't available, gracefully fall back to local toolchain
            // when runtime/compiler dependencies exist.
            const missingLocalDependencies = await this._getMissingLocalDependencies(language);
            if (missingLocalDependencies.length > 0) {
                return this._buildBatchEnvironmentErrors(
                    testCases,
                    language,
                    ['docker daemon/image', ...missingLocalDependencies]
                );
            }
        }

        const missingLocalDependencies = await this._getMissingLocalDependencies(language);
        if (missingLocalDependencies.length > 0) {
            const dockerFallback = await this._tryDockerBatchFallback(
                code,
                language,
                batchPayload,
                timeLimit,
                problemDetails,
                testCases
            );
            if (dockerFallback) return dockerFallback;

            return this._buildBatchEnvironmentErrors(testCases, language, missingLocalDependencies);
        }

        // LOCAL STRATEGY
        const result = language === 'c'
            ? await this._executeLeetStyleCBatchLocally(code, inputs, timeLimit, problemDetails)
            : await this.executeLocally(code, language, batchPayload, timeLimit, problemDetails);

        if (result.status === 'accepted' || result.status === 'runtime_error') {
            const parsed = this._parseDriverResults(result.stdout);
            if (parsed) {
                return this._applyDriverMetricFallback(parsed, {
                    time: result.time,
                    memory: result.memory
                });
            }

            const errorMessage = this._buildDriverOutputError(language, result, problemDetails);
            return testCases.map(() => ({
                stdout: '',
                stderr: errorMessage,
                printedOutput: '',
                returnMissing: false,
                time: 0,
                memory: 0,
                rawOutput: result.stdout || ''
            }));
        }
        return result; // time_limit or compilation error
    }

    _validateResultValues(returnedStr, expectedStr, declaredType, returnMissing, testCase = {}, problemDetails = {}) {
        if (!declaredType) declaredType = 'void';

        if (returnMissing) {
            return "Function returned None. Did you forget to use return statement?";
        }

        const actualVal = parseExecutionValue(returnedStr);
        const expectedVal = parseExecutionValue(expectedStr);
        const validationType = normalizeOutputValidationType(
            testCase?.validationType || problemDetails?.validationType
        );

        return validateOutputByRule({
            validationType,
            validationKey: problemDetails?.validationKey,
            tolerance: problemDetails?.tolerance,
            actualOutput: actualVal,
            expectedOutput: expectedVal,
            testCaseInput: testCase?.input,
            declaredType
        });
    }

    async runTestCases(code, language, testCases, timeLimit = 2000, problemDetails = {}) {
        // Delegate to executeBatch
        const rawResults = await this.executeBatch(code, language, testCases, timeLimit, problemDetails);
        const expectedCount = testCases.length;

        // Verification: rawResults should be an Array
        if (!Array.isArray(rawResults)) {
            // Logic error or crash
            return testCases.map(tc => ({
                input: tc.input,
                expectedOutput: tc.output,
                actualOutput: '',
                passed: false,
                error: rawResults.stderr || 'Execution failed',
                printedOutput: '',
                returnMissing: false,
                runtime: 0,
                memory: 0
            }));
        }

        if (rawResults.length !== expectedCount) {
            console.error(`[Judge Warning] Expected ${expectedCount} test results but received ${rawResults.length}.`);
            return testCases.map((tc) => ({
                input: tc.input,
                expectedOutput: tc.output,
                actualOutput: '',
                passed: false,
                runtime: 0,
                memory: 0,
                error: `Execution failed: Judge returned inconsistent result count (${rawResults.length}/${expectedCount}).`,
                printedOutput: '',
                returnMissing: false
            }));
        }

        const evaluatedResults = testCases.map((tc, i) => {
            const res = rawResults[i];
            if (!res || typeof res !== 'object') {
                return {
                    input: tc.input,
                    expectedOutput: tc.output,
                    actualOutput: '',
                    passed: false,
                    runtime: 0,
                    memory: 0,
                    error: `Execution failed: Judge returned incomplete results (${rawResults.length}/${expectedCount}).`,
                    printedOutput: '',
                    returnMissing: false
                };
            }

            const expectedOutputRaw = tc.output;
            const returnedOutputRaw = res.stdout;
            const printedOutput = this._normalizeOutput(res.printedOutput);
            const hasPrintedOutput = printedOutput.length > 0;
            const returnMissing = Boolean(res.returnMissing);
            const runtimeValue = Number(res.time ?? res.runtime ?? 0);
            const memoryValue = Number(res.memory ?? 0);
            const declaredReturnType = problemDetails?.returnType || 'void';

            let error = this._normalizeOutput(res.stderr);
            let passed = false;

            let comparableOutput = returnedOutputRaw;
            let validationReturnMissing = returnMissing;
            const hasExplicitReturnValue = String(returnedOutputRaw ?? '').trim().length > 0;

            // If user prints the final answer and doesn't explicitly return, validate against stdout.
            if (!hasExplicitReturnValue && hasPrintedOutput) {
                comparableOutput = printedOutput;
                validationReturnMissing = false;
            }

            if (!error) {
                const validationError = this._validateResultValues(
                    comparableOutput,
                    expectedOutputRaw,
                    declaredReturnType,
                    validationReturnMissing,
                    tc,
                    problemDetails
                );
                if (validationError) {
                    error = validationError;
                } else {
                    passed = true;
                }
            }

            return {
                input: tc.input,
                expectedOutput: expectedOutputRaw,
                actualOutput: comparableOutput,
                passed,
                runtime: Number.isFinite(runtimeValue) ? runtimeValue : 0,
                memory: Number.isFinite(memoryValue) ? memoryValue : 0,
                error,
                printedOutput,
                returnMissing
            };
        });

        const hasReturnTypeMismatch = evaluatedResults.some((result) =>
            typeof result.error === 'string'
            && result.error.toLowerCase().includes('return type mismatch')
        );

        if (hasReturnTypeMismatch) {
            return evaluatedResults.map((result) => {
                if (result.passed) {
                    return {
                        ...result,
                        passed: false,
                        error: 'Return type contract violated across test cases.'
                    };
                }
                return result;
            });
        }

        return evaluatedResults;
    }

    async runTestCasesSerial(code, language, testCases, timeLimit = 2000, problemDetails = {}, options = {}) {
        const stopOnFailure = options.stopOnFailure !== false;
        const results = [];

        for (let i = 0; i < testCases.length; i++) {
            const singleCase = testCases[i];
            const [singleResult] = await this.runTestCases(
                code,
                language,
                [singleCase],
                timeLimit,
                problemDetails
            );

            const normalized = singleResult || {
                input: singleCase.input,
                expectedOutput: singleCase.output,
                actualOutput: '',
                passed: false,
                runtime: 0,
                memory: 0,
                error: 'Execution failed',
                printedOutput: '',
                returnMissing: false
            };

            normalized.testCaseNumber = i + 1;
            results.push(normalized);

            if (stopOnFailure && !normalized.passed) {
                break;
            }
        }

        return results;
    }
}

module.exports = new CodeExecutor();
