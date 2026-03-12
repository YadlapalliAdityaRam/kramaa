const { isDeepStrictEqual } = require('util');
const {
    resolveTypeSpec,
    getValidatorForSpec,
    typeSpecToString
} = require('./typeRegistry');

const OUTPUT_VALIDATION_TYPES = Object.freeze({
    EXACT: 'exact',
    UNORDERED_ARRAY: 'unordered-array',
    FLOAT: 'float',
    ANY_VALID: 'any-valid'
});

const SUPPORTED_OUTPUT_VALIDATION_TYPES = new Set(Object.values(OUTPUT_VALIDATION_TYPES));
const DEFAULT_FLOAT_TOLERANCE = 1e-6;

const normalizeOutputValidationType = (rawType) => {
    const normalized = String(rawType || '').trim().toLowerCase();
    if (!normalized) return OUTPUT_VALIDATION_TYPES.EXACT;
    if (SUPPORTED_OUTPUT_VALIDATION_TYPES.has(normalized)) return normalized;
    return OUTPUT_VALIDATION_TYPES.EXACT;
};

const isSupportedOutputValidationType = (rawType) => {
    const normalized = String(rawType || '').trim().toLowerCase();
    return SUPPORTED_OUTPUT_VALIDATION_TYPES.has(normalized);
};

const normalizeFloatTolerance = (rawTolerance) => {
    const parsed = Number(rawTolerance);
    if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_FLOAT_TOLERANCE;
    return parsed;
};

const parseExecutionValue = (value, declaredType = 'void') => {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string') return value;

    const spec = resolveTypeSpec(declaredType || 'void');
    const trimmed = value.trim();

    if (spec.depth === 0 && (spec.baseType === 'string' || spec.baseType === 'char')) {
        if (!value.length) return '';

        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (typeof parsed === 'string') return parsed;
            } catch {
                return value;
            }
        }

        return value;
    }

    if (!trimmed) return null;

    try {
        return JSON.parse(trimmed);
    } catch {
        return trimmed;
    }
};

const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

const stableStringify = (value) => {
    if (value === null || value === undefined) return String(value);
    if (typeof value === 'number') return Number.isFinite(value) ? `n:${value}` : `n:${String(value)}`;
    if (typeof value === 'string') return `s:${value}`;
    if (typeof value === 'boolean') return `b:${value}`;

    if (Array.isArray(value)) {
        return `a:[${value.map((entry) => stableStringify(entry)).join(',')}]`;
    }

    if (typeof value === 'object') {
        const keys = Object.keys(value).sort();
        const parts = keys.map((key) => `${key}:${stableStringify(value[key])}`);
        return `o:{${parts.join(',')}}`;
    }

    return `${typeof value}:${String(value)}`;
};

const compareAsUnorderedMultiset = (left = [], right = []) => {
    if (left.length !== right.length) return false;

    const counts = new Map();
    left.forEach((entry) => {
        const key = stableStringify(entry);
        counts.set(key, (counts.get(key) || 0) + 1);
    });

    for (const entry of right) {
        const key = stableStringify(entry);
        const available = counts.get(key) || 0;
        if (available <= 0) return false;
        if (available === 1) counts.delete(key);
        else counts.set(key, available - 1);
    }

    return counts.size === 0;
};

const getDeclaredTypeContext = (declaredType) => {
    const spec = resolveTypeSpec(declaredType || 'void');
    const validator = getValidatorForSpec(spec);
    return {
        spec,
        validator,
        expectedTypeName: typeSpecToString(spec)
    };
};

const validateExactOutput = ({ actualOutput, expectedOutput, declaredType }) => {
    const { spec, validator, expectedTypeName } = getDeclaredTypeContext(declaredType);

    if (!validator) {
        return `Unsupported return type '${declaredType}'.`;
    }

    if (typeof expectedOutput === 'string' && spec.baseType !== 'string' && spec.baseType !== 'char') {
        return `Expected output stored as string '${expectedOutput}' but declared type is ${expectedTypeName}.`;
    }

    if (!validator(expectedOutput)) {
        return `Expected output type mismatch for declared return type '${expectedTypeName}'.`;
    }

    if (!validator(actualOutput)) {
        return `Return type mismatch. Expected ${expectedTypeName}.`;
    }

    const normalizedActual = JSON.parse(JSON.stringify(actualOutput));
    const normalizedExpected = JSON.parse(JSON.stringify(expectedOutput));

    if (!isDeepStrictEqual(normalizedActual, normalizedExpected)) {
        return 'Wrong Answer. Output value does not match expected result.';
    }

    return null;
};

const validateUnorderedArrayOutput = ({ actualOutput, expectedOutput, declaredType }) => {
    const { spec, expectedTypeName } = getDeclaredTypeContext(declaredType);
    if (spec.depth !== 1) {
        return `Return type mismatch. Expected 1D array return type, got '${expectedTypeName}'.`;
    }

    if (!Array.isArray(expectedOutput)) {
        return 'Expected output must be an array for unordered-array validation.';
    }

    if (!Array.isArray(actualOutput)) {
        return 'Return type mismatch. Expected array output.';
    }

    if (expectedOutput.some((entry) => Array.isArray(entry)) || actualOutput.some((entry) => Array.isArray(entry))) {
        return 'Nested arrays are not supported for unordered-array validation.';
    }

    if (actualOutput.length !== expectedOutput.length) {
        return 'Wrong Answer. Array length does not match expected output.';
    }

    const elementSpec = { baseType: spec.baseType, depth: 0 };
    const elementValidator = getValidatorForSpec(elementSpec);
    if (!elementValidator) {
        return `Unsupported return element type '${spec.baseType}'.`;
    }

    if (!expectedOutput.every((entry) => elementValidator(entry))) {
        return `Expected output type mismatch for declared return type '${expectedTypeName}'.`;
    }

    if (!actualOutput.every((entry) => elementValidator(entry))) {
        return `Return type mismatch. Expected ${expectedTypeName}.`;
    }

    if (!compareAsUnorderedMultiset(actualOutput, expectedOutput)) {
        return 'Wrong Answer. Unordered array elements do not match expected output.';
    }

    return null;
};

const validateNumberOrNumberArray = (value) => {
    if (isFiniteNumber(value)) {
        return { valid: true, isArray: false };
    }

    if (Array.isArray(value)) {
        if (value.some((entry) => Array.isArray(entry))) {
            return { valid: false, message: 'Nested arrays are not supported for floating-point validation.' };
        }
        if (!value.every((entry) => isFiniteNumber(entry))) {
            return { valid: false, message: 'All values must be finite numbers for floating-point validation.' };
        }
        return { valid: true, isArray: true };
    }

    return { valid: false, message: 'Output must be a number or an array of numbers for floating-point validation.' };
};

const validateFloatOutput = ({ actualOutput, expectedOutput, tolerance }) => {
    const safeTolerance = normalizeFloatTolerance(tolerance);

    const expectedCheck = validateNumberOrNumberArray(expectedOutput);
    if (!expectedCheck.valid) {
        return `Expected output type mismatch. ${expectedCheck.message}`;
    }

    const actualCheck = validateNumberOrNumberArray(actualOutput);
    if (!actualCheck.valid) {
        return `Return type mismatch. ${actualCheck.message}`;
    }

    if (expectedCheck.isArray !== actualCheck.isArray) {
        return 'Return type mismatch. Output shape does not match expected output.';
    }

    if (!expectedCheck.isArray) {
        return Math.abs(actualOutput - expectedOutput) < safeTolerance
            ? null
            : `Wrong Answer. Absolute difference exceeds tolerance (${safeTolerance}).`;
    }

    if (actualOutput.length !== expectedOutput.length) {
        return 'Wrong Answer. Array length does not match expected output.';
    }

    for (let index = 0; index < expectedOutput.length; index += 1) {
        if (Math.abs(actualOutput[index] - expectedOutput[index]) >= safeTolerance) {
            return `Wrong Answer. Absolute difference exceeds tolerance (${safeTolerance}) at index ${index}.`;
        }
    }

    return null;
};

const pickPrimaryStringPair = (input) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;

    if (typeof input.s === 'string' && typeof input.t === 'string') {
        return { s: input.s, t: input.t };
    }

    const entries = Object.values(input).filter((value) => typeof value === 'string');
    if (entries.length >= 2) {
        return { s: entries[0], t: entries[1] };
    }

    return null;
};

const computeLongestCommonSubstringLength = (left, right) => {
    const n = left.length;
    const m = right.length;
    const dp = Array(m + 1).fill(0);
    let best = 0;

    for (let i = 1; i <= n; i += 1) {
        let prev = 0;
        for (let j = 1; j <= m; j += 1) {
            const temp = dp[j];
            if (left[i - 1] === right[j - 1]) {
                dp[j] = prev + 1;
                if (dp[j] > best) best = dp[j];
            } else {
                dp[j] = 0;
            }
            prev = temp;
        }
    }

    return best;
};

const anyValidValidators = Object.freeze({
    'longest-common-substring': ({ actualOutput, input }) => {
        if (typeof actualOutput !== 'string') {
            return { valid: false, message: 'Output must be a string for longest-common-substring validation.' };
        }

        const pair = pickPrimaryStringPair(input);
        if (!pair) {
            return { valid: false, message: 'Input must include two strings (s and t) for longest-common-substring validation.' };
        }

        const { s, t } = pair;
        if (!s.includes(actualOutput) || !t.includes(actualOutput)) {
            return { valid: false, message: 'Wrong Answer. Output is not a common substring of both strings.' };
        }

        const maxLen = computeLongestCommonSubstringLength(s, t);
        if (actualOutput.length !== maxLen) {
            return {
                valid: false,
                message: `Wrong Answer. Output length must equal longest common substring length (${maxLen}).`
            };
        }

        return { valid: true };
    }
});

const hasAnyValidValidator = (key) => Object.prototype.hasOwnProperty.call(anyValidValidators, String(key || '').trim());

const validateAnyValidOutput = ({ actualOutput, validationKey, input }) => {
    const normalizedKey = String(validationKey || '').trim();
    if (!normalizedKey) {
        return 'Validation key is required for any-valid validation.';
    }

    const validator = anyValidValidators[normalizedKey];
    if (typeof validator !== 'function') {
        return `Unsupported any-valid validation key '${normalizedKey}'.`;
    }

    const result = validator({ actualOutput, input });
    if (!result || result.valid !== true) {
        return result?.message || 'Wrong Answer. Output does not satisfy validation constraints.';
    }

    return null;
};

const validateOutputByRule = ({
    validationType,
    validationKey,
    tolerance,
    actualOutput,
    expectedOutput,
    testCaseInput,
    declaredType
}) => {
    const resolvedType = normalizeOutputValidationType(validationType);

    if (resolvedType === OUTPUT_VALIDATION_TYPES.UNORDERED_ARRAY) {
        return validateUnorderedArrayOutput({ actualOutput, expectedOutput, declaredType });
    }

    if (resolvedType === OUTPUT_VALIDATION_TYPES.FLOAT) {
        return validateFloatOutput({ actualOutput, expectedOutput, tolerance });
    }

    if (resolvedType === OUTPUT_VALIDATION_TYPES.ANY_VALID) {
        return validateAnyValidOutput({ actualOutput, validationKey, input: testCaseInput });
    }

    return validateExactOutput({ actualOutput, expectedOutput, declaredType });
};

module.exports = {
    OUTPUT_VALIDATION_TYPES,
    DEFAULT_FLOAT_TOLERANCE,
    normalizeOutputValidationType,
    isSupportedOutputValidationType,
    normalizeFloatTolerance,
    parseExecutionValue,
    hasAnyValidValidator,
    validateOutputByRule
};
