const deepDecodeString = (value) => {
    if (typeof value !== 'string') return value;
    let current = value;
    for (let i = 0; i < 6; i++) {
        let changed = false;
        const trimmed = current.trim();
        if (trimmed.includes('\\"')) {
            const unescapedQuotes = trimmed.replace(/\\"/g, '"');
            if (unescapedQuotes !== trimmed) {
                current = unescapedQuotes;
                changed = true;
            }
        }

        const quotedCandidate = current.trim();
        if (quotedCandidate.startsWith('"') && quotedCandidate.endsWith('"')) {
            try {
                const parsed = JSON.parse(quotedCandidate);
                if (typeof parsed === 'string' && parsed !== current) {
                    current = parsed;
                    changed = true;
                }
            } catch {
                // Keep current value when parsing fails.
            }
        }

        if (!changed) break;
    }
    return current;
};

const maybeParseJson = (value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed) return value;

    if (
        (trimmed.startsWith('[') && trimmed.endsWith(']'))
        || (trimmed.startsWith('{') && trimmed.endsWith('}'))
    ) {
        try {
            return JSON.parse(trimmed);
        } catch {
            return value;
        }
    }

    return value;
};

const resolveParamType = (param = {}) => {
    let type = param?.type || '';
    if (param?.is2D) type += '[][]';
    else if (param?.isArray) type += '[]';
    return type;
};

const formatValue = (val, type = '') => {
    if (Array.isArray(val)) {
        const baseType = (type || '').replace(/\[\]/g, '');
        return `[${val.map((item) => formatValue(item, baseType)).join(', ')}]`;
    }

    const normalizedType = String(type || '').toLowerCase();
    if (normalizedType === 'string' || normalizedType === 'char') {
        const normalized = deepDecodeString(val);
        return typeof normalized === 'string' ? `"${normalized}"` : `"${String(normalized)}"`;
    }

    if (typeof val === 'string') {
        const normalized = deepDecodeString(val);
        return typeof normalized === 'string' ? normalized : String(normalized);
    }

    if (val === null || val === undefined) return String(val);
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
};

export const formatTestCaseInput = (inputValue, parameters = []) => {
    if (inputValue === null || inputValue === undefined) return '';

    const raw = typeof inputValue === 'string' ? inputValue : JSON.stringify(inputValue);
    let parsed = inputValue;
    if (typeof raw === 'string') {
        try {
            parsed = JSON.parse(raw);
        } catch {
            return formatValue(raw);
        }
    }

    if (Array.isArray(parsed)) {
        if (parameters.length === 1) {
            const param = parameters[0];
            const paramName = param?.name || 'param1';
            const paramType = resolveParamType(param);
            const expectsCollection = Boolean(param?.isArray || param?.is2D);
            let value = parsed;

            if (!expectsCollection && parsed.length === 1) {
                value = parsed[0];
            } else if (
                expectsCollection
                && parsed.length === 1
                && typeof parsed[0] === 'string'
            ) {
                const decoded = maybeParseJson(parsed[0]);
                if (Array.isArray(decoded)) {
                    value = decoded;
                }
            }

            return `${paramName} = ${formatValue(value, paramType)}`;
        }

        if (parameters.length > 0) {
            return parsed.map((val, i) => {
                const param = parameters[i];
                const paramName = param?.name || `param${i + 1}`;
                const paramType = resolveParamType(param);
                return `${paramName} = ${formatValue(val, paramType)}`;
            }).join('\n');
        }
        if (parsed.length === 1) return formatValue(parsed[0]);
        return `[${parsed.map((val) => formatValue(val)).join(', ')}]`;
    }

    if (parsed && typeof parsed === 'object') {
        const keys = Object.keys(parsed);
        if (keys.length === 0) return '{}';
        return keys.map((key) => {
            const param = parameters.find((p) => p.name === key);
            const paramType = resolveParamType(param);
            const expectsCollection = Boolean(param?.isArray || param?.is2D);
            const value = expectsCollection ? maybeParseJson(parsed[key]) : parsed[key];
            return `${key} = ${formatValue(value, paramType)}`;
        }).join('\n');
    }

    return formatValue(parsed);
};

export const formatTestCaseOutput = (outputValue) => {
    if (outputValue === undefined) return '';
    if (outputValue === null) return 'null';

    if (typeof outputValue === 'string') return outputValue;
    if (typeof outputValue === 'number' || typeof outputValue === 'boolean') {
        return String(outputValue);
    }

    try {
        return JSON.stringify(outputValue);
    } catch {
        return String(outputValue);
    }
};
