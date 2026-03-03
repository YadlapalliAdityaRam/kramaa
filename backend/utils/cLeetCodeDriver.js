const { resolveTypeSpec, normalizeTypeName } = require('./typeRegistry');

const FORBIDDEN_C_PATTERNS = [
    /\bmain\s*\(/i,
    /\bsystem\s*\(/i,
    /\bfork\s*\(/i,
    /\bvfork\s*\(/i,
    /\bexecve?\s*\(/i,
    /\bexeclp?\s*\(/i,
    /\bexecvp\s*\(/i,
    /\bpopen\s*\(/i,
    /\bfopen\s*\(/i,
    /\bfreopen\s*\(/i,
    /\bopen\s*\(/i,
    /\bsocket\s*\(/i,
    /\bconnect\s*\(/i,
    /\bbind\s*\(/i,
    /\blisten\s*\(/i,
    /\baccept\s*\(/i,
    /\bsend\s*\(/i,
    /\brecv\s*\(/i
];

const isIntegerBase = (base) => ['int', 'long', 'short', 'byte'].includes(base);
const isFloatingBase = (base) => ['double', 'float', 'number'].includes(base);
const isBooleanBase = (base) => ['boolean', 'bool'].includes(base);
const isStringBase = (base) => base === 'string';
const isCharBase = (base) => base === 'char';

const toSafeIdentifier = (rawName, fallback) => {
    const cleaned = String(rawName || '').replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[^a-zA-Z_]+/, '');
    if (!cleaned) return fallback;
    return cleaned;
};

const normalizeProblemReturnSpec = (returnType) => {
    const spec = resolveTypeSpec(returnType || 'void');
    spec.baseType = normalizeTypeName(spec.baseType);
    return spec;
};

const normalizeParamSpec = (param) => {
    const baseTypeInfo = resolveTypeSpec(param?.type || 'int');
    const baseType = normalizeTypeName(baseTypeInfo.baseType);
    const depth = param?.is2D ? 2 : (param?.isArray ? 1 : baseTypeInfo.depth);
    return {
        name: String(param?.name || '').trim(),
        baseType,
        depth
    };
};

const getCScalarType = (baseType) => {
    if (isIntegerBase(baseType)) return 'int';
    if (isFloatingBase(baseType)) return 'double';
    if (isBooleanBase(baseType)) return 'bool';
    if (isStringBase(baseType)) return 'char*';
    if (isCharBase(baseType)) return 'char';
    if (baseType === 'void') return 'void';
    throw new Error(`Unsupported C base type '${baseType}'.`);
};

const getCTypeForDepth = (baseType, depth) => {
    const scalar = getCScalarType(baseType);
    if (depth <= 0) return scalar;

    // string scalar already has one pointer in C (char*).
    if (isStringBase(baseType)) {
        return `char${'*'.repeat(depth + 1)}`;
    }

    return `${scalar}${'*'.repeat(depth)}`;
};

const getArrayStorageElementType = (baseType) => {
    if (isStringBase(baseType)) return 'char*';
    return getCTypeForDepth(baseType, 0);
};

const escapeCString = (value) => String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');

const escapeCChar = (value) => {
    const charValue = String(value || '\0')[0] || '\0';
    if (charValue === '\\') return '\\\\';
    if (charValue === '\'') return '\\\'';
    if (charValue === '\n') return '\\n';
    if (charValue === '\r') return '\\r';
    if (charValue === '\t') return '\\t';
    return charValue;
};

const toCScalarLiteral = (baseType, value) => {
    if (isIntegerBase(baseType)) return String(Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0);
    if (isFloatingBase(baseType)) {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? String(numeric) : '0.0';
    }
    if (isBooleanBase(baseType)) return value ? 'true' : 'false';
    if (isStringBase(baseType)) return `"${escapeCString(value || '')}"`;
    if (isCharBase(baseType)) return `'${escapeCChar(value)}'`;
    return '0';
};

const getArrayPlaceholderLiteral = (baseType) => {
    if (isBooleanBase(baseType)) return 'false';
    if (isFloatingBase(baseType)) return '0.0';
    if (isStringBase(baseType)) return 'NULL';
    if (isCharBase(baseType)) return `'\0'`;
    return '0';
};

const makeTypeRegex = (typeName) => {
    const escaped = String(typeName || '')
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\s+/g, '\\s+')
        .replace(/\\\*/g, '\\s*\\*\\s*');
    return escaped;
};

const makeFunctionSignatureRegex = (functionName, returnType, argumentTypes) => {
    const name = toSafeIdentifier(functionName, 'solve').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const returnPattern = makeTypeRegex(returnType);

    if (!Array.isArray(argumentTypes) || argumentTypes.length === 0) {
        return new RegExp(`\\b${returnPattern}\\s+${name}\\s*\\(\\s*void\\s*\\)\\s*(\\{|;)`, 'm');
    }

    const argsPattern = argumentTypes
        .map((argType) => `${makeTypeRegex(argType)}\\s+[A-Za-z_][A-Za-z0-9_]*`)
        .join('\\s*,\\s*');

    return new RegExp(`\\b${returnPattern}\\s+${name}\\s*\\(\\s*${argsPattern}\\s*\\)\\s*(\\{|;)`, 'm');
};

const stripCComments = (source) => String(source || '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');

const hasNamedCFunctionDefinition = (source, functionName) => {
    const text = String(source || '');
    const safeName = String(functionName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!safeName) return false;

    const callRegex = new RegExp(`\\b${safeName}\\s*\\(`, 'g');
    let callMatch;

    while ((callMatch = callRegex.exec(text)) !== null) {
        const openParenIndex = text.indexOf('(', callMatch.index);
        if (openParenIndex === -1) continue;

        let depth = 0;
        let inString = false;
        let inChar = false;
        let escaped = false;

        for (let index = openParenIndex; index < text.length; index += 1) {
            const char = text[index];

            if (inString) {
                if (escaped) escaped = false;
                else if (char === '\\') escaped = true;
                else if (char === '"') inString = false;
                continue;
            }

            if (inChar) {
                if (escaped) escaped = false;
                else if (char === '\\') escaped = true;
                else if (char === '\'') inChar = false;
                continue;
            }

            if (char === '"') {
                inString = true;
                continue;
            }

            if (char === '\'') {
                inChar = true;
                continue;
            }

            if (char === '(') {
                depth += 1;
            } else if (char === ')') {
                depth -= 1;
                if (depth === 0) {
                    let afterIndex = index + 1;
                    while (afterIndex < text.length && /\s/.test(text[afterIndex])) {
                        afterIndex += 1;
                    }

                    if (text[afterIndex] === '{') {
                        return true;
                    }

                    break;
                }
            }
        }
    }

    return false;
};

const buildCFunctionContract = (problemDetails = {}) => {
    const functionName = toSafeIdentifier(problemDetails.functionName || 'solve', 'solve');
    const rawParameters = Array.isArray(problemDetails.parameters) ? problemDetails.parameters : [];
    const returnSpec = normalizeProblemReturnSpec(problemDetails.returnType || 'void');
    const returnType = getCTypeForDepth(returnSpec.baseType, returnSpec.depth);

    const parameters = rawParameters.map((param, index) => {
        const spec = normalizeParamSpec(param);
        const safeName = toSafeIdentifier(spec.name, `arg${index + 1}`);
        if (!safeName) throw new Error(`Invalid parameter name '${spec.name}'.`);

        if (spec.depth === 0) {
            return {
                ...spec,
                safeName,
                signatureParts: [`${getCTypeForDepth(spec.baseType, 0)} ${safeName}`],
                callArgNames: [safeName]
            };
        }

        if (spec.depth === 1) {
            return {
                ...spec,
                safeName,
                signatureParts: [
                    `${getCTypeForDepth(spec.baseType, 1)} ${safeName}`,
                    `int ${safeName}Size`
                ],
                callArgNames: [`${safeName}Data`, `${safeName}Size`]
            };
        }

        if (spec.depth === 2) {
            return {
                ...spec,
                safeName,
                signatureParts: [
                    `${getCTypeForDepth(spec.baseType, 2)} ${safeName}`,
                    `int ${safeName}Size`,
                    `int* ${safeName}ColSize`
                ],
                callArgNames: [`${safeName}Data`, `${safeName}Size`, `${safeName}ColSize`]
            };
        }

        throw new Error(`Unsupported C parameter depth '${spec.depth}' for '${safeName}'.`);
    });

    const signatureParts = parameters.flatMap((parameter) => parameter.signatureParts);
    const signatureTypeTokens = parameters.flatMap((parameter) => {
        if (parameter.depth === 0) return [getCTypeForDepth(parameter.baseType, 0)];
        if (parameter.depth === 1) return [getCTypeForDepth(parameter.baseType, 1), 'int'];
        return [getCTypeForDepth(parameter.baseType, 2), 'int', 'int*'];
    });

    if (returnSpec.depth === 1) {
        signatureParts.push('int* returnSize');
        signatureTypeTokens.push('int*');
    } else if (returnSpec.depth === 2) {
        signatureParts.push('int* returnSize', 'int** returnColumnSizes');
        signatureTypeTokens.push('int*', 'int**');
    } else if (returnSpec.depth > 2) {
        throw new Error(`Unsupported C return depth '${returnSpec.depth}'.`);
    }

    const signature = `${returnType} ${functionName}(${signatureParts.join(', ') || 'void'})`;
    return {
        functionName,
        returnType,
        returnSpec,
        parameters,
        signature,
        signatureRegex: makeFunctionSignatureRegex(functionName, returnType, signatureTypeTokens)
    };
};

const validateCUserCode = (sourceCode, contract) => {
    const rawCode = String(sourceCode || '');
    const withoutComments = stripCComments(rawCode);

    for (const pattern of FORBIDDEN_C_PATTERNS) {
        if (pattern.test(withoutComments)) {
            if (pattern.source.startsWith('\\bmain')) {
                return { valid: false, error: 'Do not define main(). Implement only the required function.' };
            }
            return { valid: false, error: 'Security Error: Use of restricted C API is not allowed in this environment.' };
        }
    }

    if (!contract.signatureRegex.test(withoutComments)) {
        // Accept ABI-equivalent declarations (for example int arr[] vs int* arr)
        // and let the compiler produce the final signature verdict.
        const hasFunctionDefinition = hasNamedCFunctionDefinition(withoutComments, contract.functionName);
        if (hasFunctionDefinition) {
            return { valid: true };
        }

        return {
            valid: false,
            error: `Function signature mismatch. Expected: ${contract.signature};`
        };
    }

    return { valid: true };
};

const buildArrayStorageDeclarations = (baseType, sourceArray, storageName, options = {}) => {
    const includeSize = options.includeSize !== false;
    const values = Array.isArray(sourceArray) ? sourceArray : [];
    const count = values.length;
    const storeType = getArrayStorageElementType(baseType);
    const pointerType = getCTypeForDepth(baseType, 1);
    const literals = values.map((entry) => toCScalarLiteral(baseType, entry));
    const placeholder = getArrayPlaceholderLiteral(baseType);

    const lines = [];
    if (includeSize) {
        lines.push(`int ${storageName}Size = ${count};`);
    }
    lines.push(
        `${storeType} ${storageName}Store[${count > 0 ? count : 1}] = { ${count > 0 ? literals.join(', ') : placeholder} };`,
        `${pointerType} ${storageName}Data = ${storageName}Store;`
    );
    return lines;
};

const buildMatrixStorageDeclarations = (baseType, sourceMatrix, storageName) => {
    const rows = Array.isArray(sourceMatrix) ? sourceMatrix : [];
    const rowCount = rows.length;
    const rowPointerType = getCTypeForDepth(baseType, 1);
    const matrixPointerType = getCTypeForDepth(baseType, 2);
    const lines = [];
    const rowPointerNames = [];
    const colSizes = [];

    rows.forEach((row, rowIndex) => {
        const rowName = `${storageName}Row${rowIndex}`;
        lines.push(...buildArrayStorageDeclarations(baseType, row, rowName, { includeSize: false }));
        rowPointerNames.push(`${rowName}Data`);
        colSizes.push(Array.isArray(row) ? row.length : 0);
    });

    lines.push(`int ${storageName}Size = ${rowCount};`);
    lines.push(`int ${storageName}ColSize[${rowCount > 0 ? rowCount : 1}] = { ${rowCount > 0 ? colSizes.join(', ') : 0} };`);
    lines.push(`${rowPointerType} ${storageName}Rows[${rowCount > 0 ? rowCount : 1}] = { ${rowCount > 0 ? rowPointerNames.join(', ') : 'NULL'} };`);
    lines.push(`${matrixPointerType} ${storageName}Data = ${storageName}Rows;`);

    return lines;
};

const buildPerCaseParameterCode = (parameter, inputObject, caseIndex) => {
    const value = inputObject && Object.prototype.hasOwnProperty.call(inputObject, parameter.name)
        ? inputObject[parameter.name]
        : undefined;
    const storageName = `${parameter.safeName}Tc${caseIndex}`;

    if (parameter.depth === 0) {
        if (isStringBase(parameter.baseType)) {
            return {
                declarations: [`char ${storageName}Value[] = "${escapeCString(value || '')}";`],
                callArgs: [`${storageName}Value`]
            };
        }

        return {
            declarations: [`${getCTypeForDepth(parameter.baseType, 0)} ${storageName}Value = ${toCScalarLiteral(parameter.baseType, value)};`],
            callArgs: [`${storageName}Value`]
        };
    }

    if (parameter.depth === 1) {
        const lines = buildArrayStorageDeclarations(parameter.baseType, value, storageName);
        return {
            declarations: lines,
            callArgs: [`${storageName}Data`, `${storageName}Size`]
        };
    }

    const lines = buildMatrixStorageDeclarations(parameter.baseType, value, storageName);
    return {
        declarations: lines,
        callArgs: [`${storageName}Data`, `${storageName}Size`, `${storageName}ColSize`]
    };
};

const buildReturnSerializationFunctionBlock = (contract) => {
    const { baseType, depth } = contract.returnSpec;
    if (depth === 0) return '';

    const serializerHelpers = `
typedef struct {
    char* data;
    size_t len;
    size_t cap;
} algo_buf;

int algo_buf_init(algo_buf* buf, size_t initialCap) {
    if (!buf) return 0;
    buf->cap = initialCap > 0 ? initialCap : 32;
    buf->len = 0;
    buf->data = (char*)malloc(buf->cap);
    if (!buf->data) return 0;
    buf->data[0] = '\\0';
    return 1;
}

int algo_buf_reserve(algo_buf* buf, size_t extra) {
    if (!buf || !buf->data) return 0;
    if (buf->len + extra + 1 <= buf->cap) return 1;
    size_t nextCap = buf->cap;
    while (buf->len + extra + 1 > nextCap) nextCap *= 2;
    char* next = (char*)realloc(buf->data, nextCap);
    if (!next) return 0;
    buf->data = next;
    buf->cap = nextCap;
    return 1;
}

int algo_buf_append_char(algo_buf* buf, char c) {
    if (!algo_buf_reserve(buf, 1)) return 0;
    buf->data[buf->len++] = c;
    buf->data[buf->len] = '\\0';
    return 1;
}

int algo_buf_append_str(algo_buf* buf, const char* text) {
    if (!text) text = "";
    size_t n = strlen(text);
    if (!algo_buf_reserve(buf, n)) return 0;
    memcpy(buf->data + buf->len, text, n);
    buf->len += n;
    buf->data[buf->len] = '\\0';
    return 1;
}

int algo_buf_append_json_string(algo_buf* buf, const char* text) {
    if (!algo_buf_append_char(buf, '"')) return 0;
    const char* s = text ? text : "";
    while (*s) {
        const char c = *s++;
        if (c == '"' || c == '\\\\') {
            if (!algo_buf_append_char(buf, '\\\\')) return 0;
            if (!algo_buf_append_char(buf, c)) return 0;
        } else if (c == '\\n') {
            if (!algo_buf_append_str(buf, "\\\\n")) return 0;
        } else if (c == '\\r') {
            if (!algo_buf_append_str(buf, "\\\\r")) return 0;
        } else if (c == '\\t') {
            if (!algo_buf_append_str(buf, "\\\\t")) return 0;
        } else {
            if (!algo_buf_append_char(buf, c)) return 0;
        }
    }
    return algo_buf_append_char(buf, '"');
}
`;

    if (depth === 1) {
        if (isIntegerBase(baseType)) {
            return `${serializerHelpers}
char* algo_serialize_ret_1d_int(const int* arr, int size) {
    if (size < 0) return NULL;
    algo_buf buf;
    if (!algo_buf_init(&buf, (size_t)(size * 16 + 8))) return NULL;
    if (!algo_buf_append_char(&buf, '[')) return NULL;
    for (int i = 0; i < size; i++) {
        if (i > 0 && !algo_buf_append_char(&buf, ',')) return NULL;
        char tmp[32];
        snprintf(tmp, sizeof(tmp), "%d", arr ? arr[i] : 0);
        if (!algo_buf_append_str(&buf, tmp)) return NULL;
    }
    if (!algo_buf_append_char(&buf, ']')) return NULL;
    return buf.data;
}
`;
        }

        if (isFloatingBase(baseType)) {
            return `${serializerHelpers}
char* algo_serialize_ret_1d_double(const double* arr, int size) {
    if (size < 0) return NULL;
    algo_buf buf;
    if (!algo_buf_init(&buf, (size_t)(size * 24 + 8))) return NULL;
    if (!algo_buf_append_char(&buf, '[')) return NULL;
    for (int i = 0; i < size; i++) {
        if (i > 0 && !algo_buf_append_char(&buf, ',')) return NULL;
        char tmp[64];
        snprintf(tmp, sizeof(tmp), "%.15g", arr ? arr[i] : 0.0);
        if (!algo_buf_append_str(&buf, tmp)) return NULL;
    }
    if (!algo_buf_append_char(&buf, ']')) return NULL;
    return buf.data;
}
`;
        }

        if (isBooleanBase(baseType)) {
            return `${serializerHelpers}
char* algo_serialize_ret_1d_bool(const bool* arr, int size) {
    if (size < 0) return NULL;
    algo_buf buf;
    if (!algo_buf_init(&buf, (size_t)(size * 6 + 8))) return NULL;
    if (!algo_buf_append_char(&buf, '[')) return NULL;
    for (int i = 0; i < size; i++) {
        if (i > 0 && !algo_buf_append_char(&buf, ',')) return NULL;
        if (!algo_buf_append_str(&buf, (arr && arr[i]) ? "true" : "false")) return NULL;
    }
    if (!algo_buf_append_char(&buf, ']')) return NULL;
    return buf.data;
}
`;
        }

        if (isStringBase(baseType)) {
            return `${serializerHelpers}
char* algo_serialize_ret_1d_string(char* const* arr, int size) {
    if (size < 0) return NULL;
    algo_buf buf;
    if (!algo_buf_init(&buf, (size_t)(size * 16 + 8))) return NULL;
    if (!algo_buf_append_char(&buf, '[')) return NULL;
    for (int i = 0; i < size; i++) {
        if (i > 0 && !algo_buf_append_char(&buf, ',')) return NULL;
        if (!algo_buf_append_json_string(&buf, arr ? arr[i] : "")) return NULL;
    }
    if (!algo_buf_append_char(&buf, ']')) return NULL;
    return buf.data;
}
`;
        }
    }

    if (depth === 2) {
        if (isIntegerBase(baseType)) {
            return `${serializerHelpers}
char* algo_serialize_ret_2d_int(int** arr, int rows, int* colSize) {
    if (rows < 0) return NULL;
    algo_buf buf;
    if (!algo_buf_init(&buf, (size_t)(rows * 24 + 16))) return NULL;
    if (!algo_buf_append_char(&buf, '[')) return NULL;
    for (int r = 0; r < rows; r++) {
        if (r > 0 && !algo_buf_append_char(&buf, ',')) return NULL;
        if (!algo_buf_append_char(&buf, '[')) return NULL;
        int cols = colSize ? colSize[r] : 0;
        for (int c = 0; c < cols; c++) {
            if (c > 0 && !algo_buf_append_char(&buf, ',')) return NULL;
            char tmp[32];
            snprintf(tmp, sizeof(tmp), "%d", (arr && arr[r]) ? arr[r][c] : 0);
            if (!algo_buf_append_str(&buf, tmp)) return NULL;
        }
        if (!algo_buf_append_char(&buf, ']')) return NULL;
    }
    if (!algo_buf_append_char(&buf, ']')) return NULL;
    return buf.data;
}
`;
        }

        if (isFloatingBase(baseType)) {
            return `${serializerHelpers}
char* algo_serialize_ret_2d_double(double** arr, int rows, int* colSize) {
    if (rows < 0) return NULL;
    algo_buf buf;
    if (!algo_buf_init(&buf, (size_t)(rows * 32 + 16))) return NULL;
    if (!algo_buf_append_char(&buf, '[')) return NULL;
    for (int r = 0; r < rows; r++) {
        if (r > 0 && !algo_buf_append_char(&buf, ',')) return NULL;
        if (!algo_buf_append_char(&buf, '[')) return NULL;
        int cols = colSize ? colSize[r] : 0;
        for (int c = 0; c < cols; c++) {
            if (c > 0 && !algo_buf_append_char(&buf, ',')) return NULL;
            char tmp[64];
            snprintf(tmp, sizeof(tmp), "%.15g", (arr && arr[r]) ? arr[r][c] : 0.0);
            if (!algo_buf_append_str(&buf, tmp)) return NULL;
        }
        if (!algo_buf_append_char(&buf, ']')) return NULL;
    }
    if (!algo_buf_append_char(&buf, ']')) return NULL;
    return buf.data;
}
`;
        }

        if (isBooleanBase(baseType)) {
            return `${serializerHelpers}
char* algo_serialize_ret_2d_bool(bool** arr, int rows, int* colSize) {
    if (rows < 0) return NULL;
    algo_buf buf;
    if (!algo_buf_init(&buf, (size_t)(rows * 16 + 16))) return NULL;
    if (!algo_buf_append_char(&buf, '[')) return NULL;
    for (int r = 0; r < rows; r++) {
        if (r > 0 && !algo_buf_append_char(&buf, ',')) return NULL;
        if (!algo_buf_append_char(&buf, '[')) return NULL;
        int cols = colSize ? colSize[r] : 0;
        for (int c = 0; c < cols; c++) {
            if (c > 0 && !algo_buf_append_char(&buf, ',')) return NULL;
            if (!algo_buf_append_str(&buf, (arr && arr[r] && arr[r][c]) ? "true" : "false")) return NULL;
        }
        if (!algo_buf_append_char(&buf, ']')) return NULL;
    }
    if (!algo_buf_append_char(&buf, ']')) return NULL;
    return buf.data;
}
`;
        }

        if (isStringBase(baseType)) {
            return `${serializerHelpers}
char* algo_serialize_ret_2d_string(char*** arr, int rows, int* colSize) {
    if (rows < 0) return NULL;
    algo_buf buf;
    if (!algo_buf_init(&buf, (size_t)(rows * 24 + 16))) return NULL;
    if (!algo_buf_append_char(&buf, '[')) return NULL;
    for (int r = 0; r < rows; r++) {
        if (r > 0 && !algo_buf_append_char(&buf, ',')) return NULL;
        if (!algo_buf_append_char(&buf, '[')) return NULL;
        int cols = colSize ? colSize[r] : 0;
        for (int c = 0; c < cols; c++) {
            if (c > 0 && !algo_buf_append_char(&buf, ',')) return NULL;
            const char* cell = (arr && arr[r] && arr[r][c]) ? arr[r][c] : "";
            if (!algo_buf_append_json_string(&buf, cell)) return NULL;
        }
        if (!algo_buf_append_char(&buf, ']')) return NULL;
    }
    if (!algo_buf_append_char(&buf, ']')) return NULL;
    return buf.data;
}
`;
        }
    }

    throw new Error(`Unsupported C return type '${baseType}${'[]'.repeat(depth)}' for serialization.`);
};

const buildCaseExecutionBlock = (contract, inputObject, caseIndex) => {
    const declarations = [];
    const callArgs = [];

    contract.parameters.forEach((parameter) => {
        const built = buildPerCaseParameterCode(parameter, inputObject, caseIndex);
        declarations.push(...built.declarations);
        callArgs.push(...built.callArgs);
    });

    const invocationArgs = callArgs.join(', ');
    const callPrefix = invocationArgs.length > 0 ? `${invocationArgs}, ` : '';
    const returnSpec = contract.returnSpec;

    let returnHandling = '';

    if (returnSpec.depth === 0) {
        if (isIntegerBase(returnSpec.baseType)) {
            returnHandling = `
            int resultValue = ${contract.functionName}(${invocationArgs});
            char tmp[32];
            snprintf(tmp, sizeof(tmp), "%d", resultValue);
            free(out);
            out = algo_dup_string(tmp);
`;
        } else if (isFloatingBase(returnSpec.baseType)) {
            returnHandling = `
            double resultValue = ${contract.functionName}(${invocationArgs});
            char tmp[64];
            snprintf(tmp, sizeof(tmp), "%.15g", resultValue);
            free(out);
            out = algo_dup_string(tmp);
`;
        } else if (isBooleanBase(returnSpec.baseType)) {
            returnHandling = `
            bool resultValue = ${contract.functionName}(${invocationArgs});
            free(out);
            out = algo_dup_string(resultValue ? "true" : "false");
`;
        } else if (isStringBase(returnSpec.baseType)) {
            returnHandling = `
            char* resultValue = ${contract.functionName}(${invocationArgs});
            if (!resultValue) {
                free(err);
                err = algo_dup_string("Function returned NULL for string return type.");
            } else {
                free(out);
                out = algo_dup_string(resultValue);
            }
`;
        } else if (isCharBase(returnSpec.baseType)) {
            returnHandling = `
            char resultValue = ${contract.functionName}(${invocationArgs});
            char tmp[2];
            tmp[0] = resultValue;
            tmp[1] = '\\0';
            free(out);
            out = algo_dup_string(tmp);
`;
        } else if (returnSpec.baseType === 'void') {
            returnHandling = `
            ${contract.functionName}(${invocationArgs});
            returnMissing = 1;
`;
        } else {
            throw new Error(`Unsupported scalar C return type '${returnSpec.baseType}'.`);
        }
    } else if (returnSpec.depth === 1) {
        let serializer = '';
        if (isIntegerBase(returnSpec.baseType)) serializer = 'algo_serialize_ret_1d_int';
        else if (isFloatingBase(returnSpec.baseType)) serializer = 'algo_serialize_ret_1d_double';
        else if (isBooleanBase(returnSpec.baseType)) serializer = 'algo_serialize_ret_1d_bool';
        else if (isStringBase(returnSpec.baseType)) serializer = 'algo_serialize_ret_1d_string';
        else throw new Error(`Unsupported 1D C return base type '${returnSpec.baseType}'.`);

        returnHandling = `
            int returnSize = 0;
            ${getCTypeForDepth(returnSpec.baseType, 1)} resultValue = ${contract.functionName}(${callPrefix}&returnSize);
            if (returnSize < 0) {
                free(err);
                err = algo_dup_string("Function produced invalid returnSize.");
            } else if (!resultValue && returnSize > 0) {
                free(err);
                err = algo_dup_string("Function returned NULL with non-zero returnSize.");
            } else {
                free(out);
                out = ${serializer}(resultValue, returnSize);
                if (!out) {
                    out = algo_dup_string("");
                    free(err);
                    err = algo_dup_string("Failed to serialize returned array.");
                }
            }
`;
    } else if (returnSpec.depth === 2) {
        let serializer = '';
        if (isIntegerBase(returnSpec.baseType)) serializer = 'algo_serialize_ret_2d_int';
        else if (isFloatingBase(returnSpec.baseType)) serializer = 'algo_serialize_ret_2d_double';
        else if (isBooleanBase(returnSpec.baseType)) serializer = 'algo_serialize_ret_2d_bool';
        else if (isStringBase(returnSpec.baseType)) serializer = 'algo_serialize_ret_2d_string';
        else throw new Error(`Unsupported 2D C return base type '${returnSpec.baseType}'.`);

        returnHandling = `
            int returnSize = 0;
            int* returnColumnSizes = NULL;
            ${getCTypeForDepth(returnSpec.baseType, 2)} resultValue = ${contract.functionName}(${callPrefix}&returnSize, &returnColumnSizes);
            if (returnSize < 0) {
                free(err);
                err = algo_dup_string("Function produced invalid returnSize.");
            } else if ((!resultValue || !returnColumnSizes) && returnSize > 0) {
                free(err);
                err = algo_dup_string("Function returned invalid 2D structure pointers.");
            } else {
                free(out);
                out = ${serializer}(resultValue, returnSize, returnColumnSizes);
                if (!out) {
                    out = algo_dup_string("");
                    free(err);
                    err = algo_dup_string("Failed to serialize returned matrix.");
                }
            }
`;
    } else {
        throw new Error(`Unsupported C return depth '${returnSpec.depth}'.`);
    }

    return `
        {
${declarations.map((line) => `            ${line}`).join('\n')}
${returnHandling.trimEnd()}
        }
`;
};

const generateCDriverCode = (problemDetails = {}, testCaseInputs = []) => {
    const contract = buildCFunctionContract(problemDetails);
    const serializerBlock = buildReturnSerializationFunctionBlock(contract);

    const cases = (Array.isArray(testCaseInputs) ? testCaseInputs : []).map((inputObj, index) =>
        buildCaseExecutionBlock(contract, inputObj || {}, index)
    );

    return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <time.h>
#ifdef _WIN32
#include <windows.h>
#include <psapi.h>
#endif
#ifdef __linux__
#include <unistd.h>
#endif

#ifdef _WIN32
#include <io.h>
#define DUP _dup
#define DUP2 _dup2
#define CLOSE _close
#define FILENO _fileno
#else
#define DUP dup
#define DUP2 dup2
#define CLOSE close
#define FILENO fileno
#endif

extern ${contract.signature};

char* algo_dup_string(const char* s) {
    size_t len = s ? strlen(s) : 0;
    char* out = (char*)malloc(len + 1);
    if (!out) return NULL;
    if (len > 0) memcpy(out, s, len);
    out[len] = '\\0';
    return out;
}

void algo_json_escape_print(const char* s) {
    if (!s) return;
    while (*s) {
        char c = *s++;
        if (c == '"') printf("\\\\\\"");
        else if (c == '\\\\') printf("\\\\\\\\");
        else if (c == '\\n') printf("\\\\n");
        else if (c == '\\t') printf("\\\\t");
        else if (c == '\\r') printf("\\\\r");
        else putchar(c);
    }
}

char* algo_read_stream_to_string(FILE* fp) {
    if (!fp) return algo_dup_string("");
    if (fseek(fp, 0, SEEK_END) != 0) return algo_dup_string("");
    long size = ftell(fp);
    if (size < 0) return algo_dup_string("");
    rewind(fp);

    char* data = (char*)malloc((size_t)size + 1);
    if (!data) return algo_dup_string("");
    size_t read = fread(data, 1, (size_t)size, fp);
    data[read] = '\\0';
    return data;
}

double algo_current_memory_mb(void) {
#ifdef _WIN32
    PROCESS_MEMORY_COUNTERS_EX pmc;
    if (!GetProcessMemoryInfo(GetCurrentProcess(), (PROCESS_MEMORY_COUNTERS*)&pmc, sizeof(pmc))) {
        return 0.0;
    }
    return (double)pmc.WorkingSetSize / (1024.0 * 1024.0);
#elif defined(__linux__)
    FILE* f = fopen("/proc/self/statm", "r");
    if (!f) return 0.0;
    long size = 0;
    long resident = 0;
    if (fscanf(f, "%ld %ld", &size, &resident) != 2) {
        fclose(f);
        return 0.0;
    }
    fclose(f);
    long pageSize = sysconf(_SC_PAGESIZE);
    if (pageSize <= 0) return 0.0;
    return (resident * (double)pageSize) / (1024.0 * 1024.0);
#else
    return 0.0;
#endif
}

double algo_now_ms(void) {
#ifdef _WIN32
    static LARGE_INTEGER frequency;
    static int initialized = 0;
    LARGE_INTEGER counter;
    if (!initialized) {
        if (!QueryPerformanceFrequency(&frequency) || frequency.QuadPart == 0) {
            return (double)clock() * 1000.0 / (double)CLOCKS_PER_SEC;
        }
        initialized = 1;
    }
    QueryPerformanceCounter(&counter);
    return (double)counter.QuadPart * 1000.0 / (double)frequency.QuadPart;
#else
    struct timespec ts;
    if (timespec_get(&ts, TIME_UTC) == TIME_UTC) {
        return (double)ts.tv_sec * 1000.0 + (double)ts.tv_nsec / 1000000.0;
    }
    return (double)clock() * 1000.0 / (double)CLOCKS_PER_SEC;
#endif
}

${serializerBlock}

int main(void) {
    printf("[");
${cases.map((caseBlock, index) => `
    ${index > 0 ? 'printf(",");' : ''}
    {
        char* out = algo_dup_string("");
        char* err = algo_dup_string("");
        char* printedOutput = algo_dup_string("");
        int returnMissing = 0;
        double beforeMemory = algo_current_memory_mb();

        FILE* captureFile = tmpfile();
        int originalStdoutFd = -1;
        if (captureFile) {
            fflush(stdout);
            originalStdoutFd = DUP(FILENO(stdout));
            if (originalStdoutFd != -1) {
                DUP2(FILENO(captureFile), FILENO(stdout));
            }
        }

        double startMs = algo_now_ms();
${caseBlock}
        double endMs = algo_now_ms();
        double afterMemory = algo_current_memory_mb();
        double memoryMb = beforeMemory > afterMemory ? beforeMemory : afterMemory;

        if (captureFile) {
            fflush(stdout);
            if (originalStdoutFd != -1) {
                DUP2(originalStdoutFd, FILENO(stdout));
                CLOSE(originalStdoutFd);
            }
            free(printedOutput);
            printedOutput = algo_read_stream_to_string(captureFile);
            fclose(captureFile);
        }

        if (printedOutput && printedOutput[0] != '\\0' && (!err || err[0] == '\\0')) {
            free(err);
            err = algo_dup_string("Use return statement for final answer. Printed output is shown below.");
            free(out);
            out = algo_dup_string("");
        } else if (returnMissing && (!err || err[0] == '\\0')) {
            free(err);
            err = algo_dup_string("Function must return output using return statement.");
        }

        double elapsedMs = endMs - startMs;
        if (elapsedMs < 0.0) elapsedMs = 0.0;

        printf("{\\"stdout\\":\\"");
        algo_json_escape_print(out ? out : "");
        printf("\\",\\"stderr\\":\\"");
        algo_json_escape_print(err ? err : "");
        printf("\\",\\"printedOutput\\":\\"");
        algo_json_escape_print(printedOutput ? printedOutput : "");
        printf("\\",\\"returnMissing\\":%s", returnMissing ? "true" : "false");
        printf(",\\"time\\":%.3f,\\"memory\\":%.3f}", elapsedMs, memoryMb);

        free(out);
        free(err);
        free(printedOutput);
    }`).join('\n')}
    printf("]");
    return 0;
}
`;
};

const generateCStarterCode = (problemDetails = {}) => {
    const contract = buildCFunctionContract(problemDetails);
    const returnSpec = contract.returnSpec;

    let defaultBody = '';
    if (returnSpec.depth === 0) {
        if (returnSpec.baseType === 'void') {
            defaultBody = '    return;';
        } else if (isIntegerBase(returnSpec.baseType)) {
            defaultBody = '    return 0;';
        } else if (isFloatingBase(returnSpec.baseType)) {
            defaultBody = '    return 0.0;';
        } else if (isBooleanBase(returnSpec.baseType)) {
            defaultBody = '    return false;';
        } else if (isStringBase(returnSpec.baseType)) {
            defaultBody = '    return NULL;';
        } else if (isCharBase(returnSpec.baseType)) {
            defaultBody = "    return '\\0';";
        } else {
            defaultBody = '    return 0;';
        }
    } else if (returnSpec.depth === 1) {
        defaultBody = '    *returnSize = 0;\n    return NULL;';
    } else if (returnSpec.depth === 2) {
        defaultBody = '    *returnSize = 0;\n    *returnColumnSizes = NULL;\n    return NULL;';
    }

    return `#include <stdlib.h>
#include <stdbool.h>

${contract.signature} {
    ${contract.parameters.length > 0
        ? `/* Parameters:\n${contract.parameters.map((param) => `     * - ${param.name}`).join('\n')}\n     */`
        : '/* No input parameters for this problem. */'}
${defaultBody}
}
`;
};

module.exports = {
    buildCFunctionContract,
    validateCUserCode,
    generateCDriverCode,
    generateCStarterCode
};
