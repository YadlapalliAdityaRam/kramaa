const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const Problem = require('../models/Problem');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const tryParseJsonValue = (value) => {
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
};

const isJsonCollectionString = (value) => {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    return trimmed.startsWith('[') && trimmed.endsWith(']');
};

const normalizeCollectionValue = (value, parameterMeta = {}) => {
    if (!parameterMeta?.isArray && !parameterMeta?.is2D) return value;

    let current = value;
    for (let i = 0; i < 4; i++) {
        if (!isJsonCollectionString(current)) break;
        try {
            current = JSON.parse(current.trim());
        } catch {
            break;
        }
    }

    if (
        Array.isArray(current)
        && current.length === 1
        && typeof current[0] === 'string'
        && isJsonCollectionString(current[0])
    ) {
        try {
            const decodedInner = JSON.parse(current[0].trim());
            if (Array.isArray(decodedInner)) current = decodedInner;
        } catch {
            // Keep current value.
        }
    }

    if (parameterMeta?.is2D && Array.isArray(current)) {
        current = current.map((row) => {
            if (typeof row === 'string' && isJsonCollectionString(row)) {
                try {
                    const parsedRow = JSON.parse(row.trim());
                    if (Array.isArray(parsedRow)) return parsedRow;
                } catch {
                    return row;
                }
            }
            return row;
        });
    }

    return current;
};

const normalizeInputByParameters = (input, parameters = []) => {
    const parsedInput = tryParseJsonValue(input);

    if (!Array.isArray(parameters) || parameters.length === 0) {
        return parsedInput;
    }

    if (parsedInput && typeof parsedInput === 'object' && !Array.isArray(parsedInput)) {
        const normalized = { ...parsedInput };
        parameters.forEach((param) => {
            if (Object.prototype.hasOwnProperty.call(normalized, param.name)) {
                normalized[param.name] = normalizeCollectionValue(normalized[param.name], param);
            }
        });
        return normalized;
    }

    if (parameters.length === 1) {
        const param = parameters[0];
        let value = parsedInput;

        if (
            Array.isArray(parsedInput)
            && !param?.isArray
            && !param?.is2D
            && parsedInput.length === 1
        ) {
            value = parsedInput[0];
        }

        value = normalizeCollectionValue(value, param);
        return { [param.name]: value };
    }

    if (Array.isArray(parsedInput) && parsedInput.length === parameters.length) {
        const mapped = {};
        parameters.forEach((param, index) => {
            mapped[param.name] = normalizeCollectionValue(parsedInput[index], param);
        });
        return mapped;
    }

    return parsedInput;
};

const deepEqual = (a, b) => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!deepEqual(a[i], b[i])) return false;
        }
        return true;
    }

    if (typeof a === 'object') {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        for (const key of keysA) {
            if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
            if (!deepEqual(a[key], b[key])) return false;
        }
        return true;
    }

    return false;
};

const normalizeTestCaseArray = (testCases, parameters) => {
    let updatedCount = 0;
    if (!Array.isArray(testCases)) return updatedCount;

    for (let i = 0; i < testCases.length; i++) {
        const currentInput = testCases[i].input;
        const normalizedInput = normalizeInputByParameters(currentInput, parameters);
        if (!deepEqual(currentInput, normalizedInput)) {
            testCases[i].input = normalizedInput;
            updatedCount++;
        }
    }

    return updatedCount;
};

const run = async () => {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
        console.error('Missing MONGODB_URI or MONGO_URI');
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const problems = await Problem.find({}).select('+hiddenTestCases');
        console.log(`Scanning ${problems.length} problems...`);

        let updatedProblems = 0;
        let updatedSampleCases = 0;
        let updatedHiddenCases = 0;

        for (const problem of problems) {
            const parameters = Array.isArray(problem.parameters) ? problem.parameters : [];
            if (!parameters.some((param) => param?.isArray || param?.is2D)) {
                continue;
            }

            const sampleUpdated = normalizeTestCaseArray(problem.sampleTestCases, parameters);
            const hiddenUpdated = normalizeTestCaseArray(problem.hiddenTestCases, parameters);
            if (sampleUpdated === 0 && hiddenUpdated === 0) continue;

            await problem.save();
            updatedProblems++;
            updatedSampleCases += sampleUpdated;
            updatedHiddenCases += hiddenUpdated;

            console.log(
                `Updated ${problem.slug || problem._id}: sample=${sampleUpdated}, hidden=${hiddenUpdated}`
            );
        }

        console.log('Normalization complete.');
        console.log(`Problems updated: ${updatedProblems}`);
        console.log(`Sample test cases updated: ${updatedSampleCases}`);
        console.log(`Hidden test cases updated: ${updatedHiddenCases}`);

        process.exit(0);
    } catch (error) {
        console.error('Normalization failed:', error);
        process.exit(1);
    } finally {
        try {
            await mongoose.disconnect();
        } catch {
            // Ignore disconnect failures on exit.
        }
    }
};

run();
