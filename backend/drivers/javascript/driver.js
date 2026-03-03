const fs = require('fs');
const solution = require('./solution');

const className = process.env.ALGOVERSE_CLASS_NAME;
const funcName = process.env.ALGOVERSE_FUNCTION_NAME;
let paramNames = [];
try {
    const parsedParamNames = JSON.parse(process.env.ALGOVERSE_PARAM_NAMES || '[]');
    if (Array.isArray(parsedParamNames)) {
        paramNames = parsedParamNames.filter((name) => typeof name === 'string' && name.length > 0);
    }
} catch (error) {
    paramNames = [];
}
if (!funcName) {
    console.error('ALGOVERSE_FUNCTION_NAME environment variable not set');
    process.exit(1);
}

let targetFunc;
let targetInstance = null;

if (className && solution[className]) {
    targetInstance = new solution[className]();
    targetFunc = targetInstance[funcName];
} else {
    targetFunc = solution[funcName];
}

if (typeof targetFunc !== 'function') {
    console.error(`Function '${funcName}' not found in solution.js`);
    process.exit(1);
}

const stringifyOutput = (value) => {
    if (value === undefined) return '';
    try {
        const serialized = JSON.stringify(value);
        return typeof serialized === 'string' ? serialized : String(value);
    } catch (error) {
        return String(value);
    }
};

const stringifyArg = (value) => {
    if (typeof value === 'string') return value;
    try {
        return JSON.stringify(value);
    } catch (error) {
        return String(value);
    }
};

(async () => {
    const inputRaw = fs.readFileSync(0, 'utf-8');
    let batchInputs = [];

    try {
        batchInputs = JSON.parse(inputRaw);
    } catch (error) {
        batchInputs = [];
    }

    if (!Array.isArray(batchInputs)) batchInputs = [];

    const results = [];

    for (const input of batchInputs) {
        const start = process.hrtime.bigint();
        const startHeap = process.memoryUsage().heapUsed;
        let stdout = '';
        let stderr = '';
        let printedOutput = '';
        let returnMissing = false;

        const capturedLogs = [];
        const originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error
        };

        const captureLog = (...args) => {
            capturedLogs.push(args.map(stringifyArg).join(' '));
        };

        console.log = captureLog;
        console.info = captureLog;
        console.warn = captureLog;
        console.error = captureLog;

        try {
            let parsedArgs = input;
            try {
                parsedArgs = JSON.parse(input);
            } catch (error) {
                // Keep raw string input.
            }

            let out;
            if (Array.isArray(parsedArgs)) {
                out = targetFunc.apply(targetInstance, parsedArgs);
            } else if (parsedArgs && typeof parsedArgs === 'object') {
                const orderedArgs = paramNames.length > 0
                    ? paramNames.map((name) => parsedArgs[name])
                    : Object.values(parsedArgs);
                out = targetFunc.apply(targetInstance, orderedArgs);
            } else {
                out = targetFunc.call(targetInstance, parsedArgs);
            }
            if (out && typeof out.then === 'function') {
                out = await out;
            }

            returnMissing = out === undefined;
            stdout = returnMissing ? '' : stringifyOutput(out);
            printedOutput = capturedLogs.join('\n').trim();

            if (printedOutput) {
                stderr = 'Use return statement for final answer. Printed output is shown below.';
            } else if (returnMissing) {
                stderr = 'Function must return output using return statement.';
            }
        } catch (error) {
            printedOutput = capturedLogs.join('\n').trim();
            stderr = error && error.message ? error.message : String(error);
            returnMissing = false;
        } finally {
            console.log = originalConsole.log;
            console.info = originalConsole.info;
            console.warn = originalConsole.warn;
            console.error = originalConsole.error;
        }

        const end = process.hrtime.bigint();
        const runtime = Number(end - start) / 1e6;
        const endHeap = process.memoryUsage().heapUsed;
        const memoryMb = Math.max(startHeap, endHeap) / (1024 * 1024);

        results.push({
            stdout,
            stderr,
            printedOutput,
            returnMissing,
            time: runtime.toFixed(3),
            memory: Number(memoryMb.toFixed(3))
        });
    }

    process.stdout.write(JSON.stringify(results));
})().catch((error) => {
    console.error(`Driver Fatal Error: ${error.message || String(error)}`);
    process.exit(1);
});
