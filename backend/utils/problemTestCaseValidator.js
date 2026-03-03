const {
    TypeRegistry,
    hasTypeValidator,
    resolveTypeSpec,
    typeSpecToString,
    getValidatorForSpec,
    normalizeTypeName
} = require('./typeRegistry');
const {
    OUTPUT_VALIDATION_TYPES,
    normalizeOutputValidationType,
    isSupportedOutputValidationType,
    normalizeFloatTolerance,
    hasAnyValidValidator
} = require('./outputValidation');

const numberRegex = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
const integerRegex = /^[+-]?\d+$/;

const isPlainObject = (value) =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

const looksLikeJson = (value) => {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (!trimmed) return false;
    return (
        (trimmed.startsWith('{') && trimmed.endsWith('}'))
        || (trimmed.startsWith('[') && trimmed.endsWith(']'))
        || (trimmed.startsWith('"') && trimmed.endsWith('"'))
    );
};

const decodeNestedJson = (value) => {
    let current = value;
    for (let i = 0; i < 4; i++) {
        if (!looksLikeJson(current)) break;
        try {
            const parsed = JSON.parse(current);
            if (parsed === current) break;
            current = parsed;
        } catch {
            break;
        }
    }
    return current;
};

const decodeSerializedStringLiteral = (value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) return value;

    const decoded = decodeNestedJson(trimmed);
    if (typeof decoded === 'string') return decoded;
    return value;
};

const isWrappedStringLiteral = (value) => {
    if (typeof value !== 'string') return false;
    const decoded = decodeSerializedStringLiteral(value);
    return typeof decoded === 'string' && decoded !== value;
};

const collectWrappedStringLiteralIssues = (value, depth, path, issues, contextLabel) => {
    if (depth === 0) {
        if (isWrappedStringLiteral(value)) {
            issues.push(createIssue(
                path,
                'FORMATTED_STRING_LITERAL',
                `${contextLabel} contains wrapped quotes. Store plain string values without extra JSON quoting.`,
                value
            ));
        }
        return;
    }

    if (!Array.isArray(value)) return;
    value.forEach((entry, index) => {
        collectWrappedStringLiteralIssues(entry, depth - 1, `${path}[${index}]`, issues, contextLabel);
    });
};

class ProblemTestCaseValidationError extends Error {
    constructor(issues, message = 'Problem testcase validation failed.') {
        super(message);
        this.name = 'ProblemTestCaseValidationError';
        this.issues = Array.isArray(issues) ? issues : [];
    }
}

const createIssue = (path, code, message, value) => ({
    path,
    code,
    message,
    value
});

const coerceScalar = (value, baseType) => {
    if (baseType === 'void') {
        if (value === '' || value === undefined) return null;
        return value;
    }

    if (baseType === 'int' || baseType === 'long' || baseType === 'short' || baseType === 'byte') {
        if (typeof value === 'string' && integerRegex.test(value.trim())) {
            const parsed = Number(value.trim());
            if (Number.isSafeInteger(parsed)) return parsed;
        }
        return value;
    }

    if (baseType === 'float' || baseType === 'double' || baseType === 'number') {
        if (typeof value === 'string' && numberRegex.test(value.trim())) {
            const parsed = Number(value.trim());
            if (Number.isFinite(parsed)) return parsed;
        }
        return value;
    }

    if (baseType === 'boolean' || baseType === 'bool') {
        if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();
            if (normalized === 'true') return true;
            if (normalized === 'false') return false;
        }
        return value;
    }

    if (baseType === 'string') {
        if (value === null || value === undefined || isPlainObject(value) || Array.isArray(value)) return value;
        const asString = String(value);
        return decodeSerializedStringLiteral(asString);
    }

    if (baseType === 'char') {
        if (typeof value === 'number' && Number.isFinite(value)) {
            const text = String(value);
            if (text.length === 1) return text;
        }
        if (typeof value === 'string') {
            const parsed = decodeSerializedStringLiteral(value);
            if (typeof parsed === 'string' && parsed.length === 1) return parsed;
        }
        return value;
    }

    return value;
};

const coerceTypedValue = (value, spec) => {
    const depth = Math.max(0, Number(spec?.depth) || 0);
    const baseType = normalizeTypeName(spec?.baseType);

    if (depth === 0) {
        return coerceScalar(value, baseType);
    }

    let current = value;
    if (typeof current === 'string') {
        current = decodeNestedJson(current.trim());
    }

    if (Array.isArray(current) && current.length === 1 && typeof current[0] === 'string') {
        const decodedInner = decodeNestedJson(current[0].trim());
        if (Array.isArray(decodedInner)) {
            current = decodedInner;
        }
    }

    if (!Array.isArray(current)) {
        return current;
    }

    return current.map((entry) => {
        if (depth === 1) {
            return coerceScalar(entry, baseType);
        }
        return coerceTypedValue(entry, { baseType, depth: depth - 1 });
    });
};

const resolveParameterSpec = (parameter = {}) => {
    const declared = resolveTypeSpec(parameter?.type || '');
    const baseDepth = declared.depth;
    const flagDepth = parameter?.is2D ? 2 : (parameter?.isArray ? 1 : 0);

    return {
        name: String(parameter?.name || '').trim(),
        baseType: normalizeTypeName(declared.baseType),
        depth: Math.max(baseDepth, flagDepth)
    };
};

const validateParameterDefinitions = (parameters, issues) => {
    if (!Array.isArray(parameters)) {
        issues.push(createIssue('parameters', 'INVALID_PARAMETERS', 'Parameters must be an array.', parameters));
        return;
    }

    const seenNames = new Set();

    parameters.forEach((parameter, index) => {
        const path = `parameters.${index}`;

        if (!parameter || typeof parameter !== 'object') {
            issues.push(createIssue(path, 'INVALID_PARAMETER', 'Each parameter must be an object.', parameter));
            return;
        }

        const name = String(parameter?.name || '').trim();
        if (!name) {
            issues.push(createIssue(`${path}.name`, 'INVALID_PARAMETER_NAME', 'Parameter name is required.', parameter?.name));
        } else if (seenNames.has(name)) {
            issues.push(createIssue(`${path}.name`, 'DUPLICATE_PARAMETER', `Duplicate parameter name '${name}'.`, name));
        } else {
            seenNames.add(name);
        }

        const spec = resolveParameterSpec(parameter);
        if (!spec.baseType || spec.baseType === 'void') {
            issues.push(createIssue(`${path}.type`, 'INVALID_PARAMETER_TYPE', 'Parameter type must be a non-void type.', parameter?.type));
            return;
        }

        if (!hasTypeValidator(spec.baseType)) {
            issues.push(createIssue(`${path}.type`, 'UNSUPPORTED_TYPE', `Unsupported parameter type '${parameter?.type}'.`, parameter?.type));
        }

        if (spec.depth > 2) {
            issues.push(createIssue(`${path}.type`, 'UNSUPPORTED_TYPE', 'Only up to 2D arrays are supported.', parameter?.type));
        }
    });
};

const validateReturnTypeDefinition = (returnType, issues) => {
    const spec = resolveTypeSpec(returnType || 'void');
    if (!spec.baseType) {
        issues.push(createIssue('returnType', 'INVALID_RETURN_TYPE', 'Return type is required.', returnType));
        return spec;
    }

    if (!hasTypeValidator(spec.baseType)) {
        issues.push(createIssue('returnType', 'UNSUPPORTED_RETURN_TYPE', `Unsupported return type '${returnType}'.`, returnType));
    }

    if (spec.depth > 2) {
        issues.push(createIssue('returnType', 'UNSUPPORTED_RETURN_TYPE', 'Only up to 2D arrays are supported.', returnType));
    }

    if (spec.baseType === 'void' && spec.depth > 0) {
        issues.push(createIssue('returnType', 'INVALID_RETURN_TYPE', 'void[] is not a valid return type.', returnType));
    }

    return spec;
};

const validateOutputValidationConfig = ({ validationType, validationKey, tolerance, returnTypeSpec }, issues = []) => {
    const rawType = String(validationType || '').trim();
    if (rawType && !isSupportedOutputValidationType(rawType)) {
        issues.push(createIssue(
            'validationType',
            'UNSUPPORTED_VALIDATION_TYPE',
            `Unsupported validationType '${validationType}'.`,
            validationType
        ));
    }

    const normalizedType = normalizeOutputValidationType(validationType);
    if (normalizedType === OUTPUT_VALIDATION_TYPES.UNORDERED_ARRAY && Number(returnTypeSpec?.depth || 0) !== 1) {
        issues.push(createIssue(
            'validationType',
            'VALIDATION_RETURN_TYPE_MISMATCH',
            'validationType "unordered-array" requires a 1D array returnType.',
            validationType
        ));
    }

    if (normalizedType === OUTPUT_VALIDATION_TYPES.FLOAT) {
        const hasExplicitTolerance = !(tolerance === undefined || tolerance === null || tolerance === '');
        const normalizedTolerance = normalizeFloatTolerance(tolerance);
        if (hasExplicitTolerance && (!Number.isFinite(Number(tolerance)) || Number(tolerance) <= 0)) {
            issues.push(createIssue(
                'tolerance',
                'INVALID_TOLERANCE',
                `Tolerance must be a positive finite number. Falling back to ${normalizedTolerance}.`,
                tolerance
            ));
        }
    }

    if (normalizedType === OUTPUT_VALIDATION_TYPES.ANY_VALID) {
        const key = String(validationKey || '').trim();
        if (!key) {
            issues.push(createIssue(
                'validationKey',
                'MISSING_VALIDATION_KEY',
                'validationKey is required for validationType "any-valid".',
                validationKey
            ));
        } else if (!hasAnyValidValidator(key)) {
            issues.push(createIssue(
                'validationKey',
                'UNSUPPORTED_VALIDATION_KEY',
                `Unsupported validationKey '${key}'.`,
                validationKey
            ));
        }
    }
};

const normalizeTypedValue = (value, spec, options, path, issues, contextLabel) => {
    const allowCoercion = options?.allowCoercion === true;
    const expectedType = typeSpecToString(spec);

    let normalizedValue = value;
    if (allowCoercion) {
        normalizedValue = coerceTypedValue(value, spec);
    }

    const validator = getValidatorForSpec(spec);
    if (!validator) {
        issues.push(createIssue(path, 'UNSUPPORTED_TYPE', `Unsupported ${contextLabel} type '${expectedType}'.`, value));
        return normalizedValue;
    }

    if (!validator(normalizedValue)) {
        issues.push(createIssue(
            path,
            'TYPE_MISMATCH',
            `${contextLabel} must be of type '${expectedType}'.`,
            value
        ));
        return normalizedValue;
    }

    if (!allowCoercion && (spec.baseType === 'string' || spec.baseType === 'char')) {
        collectWrappedStringLiteralIssues(
            normalizedValue,
            Math.max(0, Number(spec.depth) || 0),
            path,
            issues,
            contextLabel
        );
    }

    return normalizedValue;
};

const normalizeInputAgainstParameters = (rawInput, parameters, options, path, issues) => {
    const allowCoercion = options?.allowCoercion === true;
    const allowPositionalInput = options?.allowPositionalInput === true;
    const allowLegacySingleParameterWrap = options?.allowLegacySingleParameterWrap === true;
    const params = Array.isArray(parameters) ? parameters : [];

    if (params.length === 0) return rawInput;

    let input = rawInput;
    if (allowCoercion && typeof input === 'string' && looksLikeJson(input.trim())) {
        input = decodeNestedJson(input.trim());
    }

    const normalizedInput = {};

    if (isPlainObject(input)) {
        const inputKeys = Object.keys(input);

        params.forEach((parameter) => {
            const spec = resolveParameterSpec(parameter);
            const valuePath = `${path}.${spec.name}`;

            if (!Object.prototype.hasOwnProperty.call(input, spec.name)) {
                issues.push(createIssue(valuePath, 'MISSING_PARAMETER', `Missing parameter '${spec.name}'.`, input));
                return;
            }

            normalizedInput[spec.name] = normalizeTypedValue(
                input[spec.name],
                spec,
                options,
                valuePath,
                issues,
                'Input parameter'
            );
        });

        const allowed = new Set(params.map((parameter) => String(parameter?.name || '').trim()));
        inputKeys.forEach((key) => {
            if (!allowed.has(key)) {
                issues.push(createIssue(`${path}.${key}`, 'UNEXPECTED_PARAMETER', `Unexpected parameter '${key}'.`, input[key]));
            }
        });

        return normalizedInput;
    }

    if (allowPositionalInput && Array.isArray(input) && input.length === params.length) {
        params.forEach((parameter, index) => {
            const spec = resolveParameterSpec(parameter);
            normalizedInput[spec.name] = normalizeTypedValue(
                input[index],
                spec,
                options,
                `${path}.${spec.name}`,
                issues,
                'Input parameter'
            );
        });
        return normalizedInput;
    }

    if (allowLegacySingleParameterWrap && params.length === 1) {
        const spec = resolveParameterSpec(params[0]);
        normalizedInput[spec.name] = normalizeTypedValue(
            input,
            spec,
            options,
            `${path}.${spec.name}`,
            issues,
            'Input parameter'
        );
        return normalizedInput;
    }

    issues.push(createIssue(
        path,
        'INPUT_STRUCTURE_MISMATCH',
        'Input must be an object keyed by parameter names.',
        rawInput
    ));
    return rawInput;
};

const normalizeOutputAgainstReturnType = (rawOutput, returnType, options, path, issues) => {
    const spec = resolveTypeSpec(returnType || 'void');

    if (spec.baseType === 'void' && spec.depth === 0) {
        if (rawOutput === null || rawOutput === undefined || rawOutput === '') {
            return null;
        }
        issues.push(createIssue(path, 'TYPE_MISMATCH', 'Output must be empty for returnType void.', rawOutput));
        return rawOutput;
    }

    return normalizeTypedValue(rawOutput, spec, options, path, issues, 'Output');
};

const normalizeOutputWithValidationType = ({
    rawOutput,
    returnType,
    options,
    path,
    issues,
    validationType,
    tolerance,
    validationKey
}) => {
    const resolvedValidationType = normalizeOutputValidationType(validationType);

    if (resolvedValidationType === OUTPUT_VALIDATION_TYPES.ANY_VALID) {
        // Any-valid validators compute correctness logically at runtime.
        return rawOutput === undefined ? null : rawOutput;
    }

    if (resolvedValidationType === OUTPUT_VALIDATION_TYPES.UNORDERED_ARRAY) {
        const returnSpec = resolveTypeSpec(returnType || 'void');
        if (returnSpec.depth !== 1) {
            issues.push(createIssue(
                path,
                'VALIDATION_RETURN_TYPE_MISMATCH',
                'validationType "unordered-array" requires a 1D array returnType.',
                returnType
            ));
            return rawOutput;
        }

        if (!Array.isArray(rawOutput)) {
            issues.push(createIssue(
                path,
                'TYPE_MISMATCH',
                'Output must be a 1D array for validationType "unordered-array".',
                rawOutput
            ));
            return rawOutput;
        }

        if (rawOutput.some((entry) => Array.isArray(entry))) {
            issues.push(createIssue(
                path,
                'TYPE_MISMATCH',
                'Nested arrays are not supported for validationType "unordered-array".',
                rawOutput
            ));
            return rawOutput;
        }

        const elementSpec = { baseType: returnSpec.baseType, depth: 0 };
        const elementValidator = getValidatorForSpec(elementSpec);
        if (!elementValidator) {
            issues.push(createIssue(
                path,
                'UNSUPPORTED_TYPE',
                `Unsupported return element type '${returnSpec.baseType}'.`,
                returnType
            ));
            return rawOutput;
        }

        rawOutput.forEach((entry, index) => {
            if (!elementValidator(entry)) {
                issues.push(createIssue(
                    `${path}[${index}]`,
                    'TYPE_MISMATCH',
                    `Array element must match declared return element type '${returnSpec.baseType}'.`,
                    entry
                ));
            }
        });

        return rawOutput;
    }

    if (resolvedValidationType === OUTPUT_VALIDATION_TYPES.FLOAT) {
        const safeTolerance = normalizeFloatTolerance(tolerance);
        if (rawOutput === null || rawOutput === undefined) {
            issues.push(createIssue(path, 'TYPE_MISMATCH', 'Output is required for validationType "float".', rawOutput));
            return rawOutput;
        }

        if (Array.isArray(rawOutput)) {
            if (rawOutput.some((entry) => Array.isArray(entry))) {
                issues.push(createIssue(
                    path,
                    'TYPE_MISMATCH',
                    'Nested arrays are not supported for validationType "float".',
                    rawOutput
                ));
                return rawOutput;
            }

            rawOutput.forEach((entry, index) => {
                if (typeof entry !== 'number' || !Number.isFinite(entry)) {
                    issues.push(createIssue(
                        `${path}[${index}]`,
                        'TYPE_MISMATCH',
                        `Each output value must be a finite number for validationType "float" (tolerance ${safeTolerance}).`,
                        entry
                    ));
                }
            });
            return rawOutput;
        }

        if (typeof rawOutput !== 'number' || !Number.isFinite(rawOutput)) {
            issues.push(createIssue(
                path,
                'TYPE_MISMATCH',
                `Output must be a finite number or array of finite numbers for validationType "float" (tolerance ${safeTolerance}).`,
                rawOutput
            ));
        }
        return rawOutput;
    }

    // EXACT (default)
    return normalizeOutputAgainstReturnType(rawOutput, returnType, options, path, issues);
};

const normalizeAndValidateTestCases = (
    testCases,
    {
        parameters = [],
        returnType = 'void',
        validationType = OUTPUT_VALIDATION_TYPES.EXACT,
        validationKey = '',
        tolerance = undefined,
        allowCoercion = false,
        allowPositionalInput = false,
        allowLegacySingleParameterWrap = false,
        fieldPrefix = 'testCases'
    } = {}
) => {
    const issues = [];
    const normalizedTestCases = [];
    const list = Array.isArray(testCases) ? testCases : [];

    validateParameterDefinitions(parameters, issues);
    const returnTypeSpec = validateReturnTypeDefinition(returnType, issues);
    validateOutputValidationConfig(
        { validationType, validationKey, tolerance, returnTypeSpec },
        issues
    );
    const normalizedGlobalValidationType = normalizeOutputValidationType(validationType);
    const normalizedTolerance = normalizeFloatTolerance(tolerance);

    list.forEach((testCase, index) => {
        const currentPath = `${fieldPrefix}.${index}`;
        if (!testCase || typeof testCase !== 'object' || Array.isArray(testCase)) {
            issues.push(createIssue(currentPath, 'INVALID_TESTCASE', 'Each testcase must be an object.', testCase));
            return;
        }

        const localIssues = [];
        const localOptions = {
            allowCoercion,
            allowPositionalInput,
            allowLegacySingleParameterWrap
        };
        const rawCaseValidationType = String(testCase?.validationType || '').trim();
        const caseValidationType = rawCaseValidationType
            ? normalizeOutputValidationType(rawCaseValidationType)
            : normalizedGlobalValidationType;

        if (rawCaseValidationType && !isSupportedOutputValidationType(rawCaseValidationType)) {
            localIssues.push(createIssue(
                `${currentPath}.validationType`,
                'UNSUPPORTED_VALIDATION_TYPE',
                `Unsupported validationType '${testCase.validationType}'.`,
                testCase.validationType
            ));
        }

        const normalizedInput = normalizeInputAgainstParameters(
            testCase.input,
            parameters,
            localOptions,
            `${currentPath}.input`,
            localIssues
        );

        const outputPath = `${currentPath}.output`;
        let normalizedOutput = testCase.output;
        if (caseValidationType === OUTPUT_VALIDATION_TYPES.ANY_VALID) {
            normalizedOutput = normalizeOutputWithValidationType({
                rawOutput: testCase.output,
                returnType: typeSpecToString(returnTypeSpec),
                options: localOptions,
                path: outputPath,
                issues: localIssues,
                validationType: caseValidationType,
                tolerance: normalizedTolerance,
                validationKey
            });
        } else {
            if (testCase.output === undefined || testCase.output === null || testCase.output === '') {
                localIssues.push(createIssue(
                    outputPath,
                    'MISSING_OUTPUT',
                    'Output is required for this validationType.',
                    testCase.output
                ));
            } else {
                normalizedOutput = normalizeOutputWithValidationType({
                    rawOutput: testCase.output,
                    returnType: typeSpecToString(returnTypeSpec),
                    options: localOptions,
                    path: outputPath,
                    issues: localIssues,
                    validationType: caseValidationType,
                    tolerance: normalizedTolerance,
                    validationKey
                });
            }
        }

        if (localIssues.length > 0) {
            issues.push(...localIssues);
        }

        normalizedTestCases.push({
            ...testCase,
            input: normalizedInput,
            output: normalizedOutput,
            validationType: caseValidationType
        });
    });

    return { normalizedTestCases, issues };
};

const validateOrThrow = (testCases, options) => {
    const result = normalizeAndValidateTestCases(testCases, options);
    if (result.issues.length > 0) {
        throw new ProblemTestCaseValidationError(result.issues);
    }
    return result.normalizedTestCases;
};

module.exports = {
    TypeRegistry,
    ProblemTestCaseValidationError,
    normalizeAndValidateTestCases,
    validateOrThrow,
    resolveReturnTypeSpec: resolveTypeSpec
};
