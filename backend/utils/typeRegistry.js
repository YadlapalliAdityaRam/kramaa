const normalizeTypeName = (value) => String(value || '').trim().toLowerCase();

const registry = Object.create(null);

const registerType = (typeName, validator) => {
    const key = normalizeTypeName(typeName);
    if (!key) {
        throw new Error('Type name is required.');
    }
    if (typeof validator !== 'function') {
        throw new Error(`Validator for type '${key}' must be a function.`);
    }
    registry[key] = validator;
    return key;
};

const hasTypeValidator = (typeName) => {
    const key = normalizeTypeName(typeName);
    return Boolean(key && registry[key]);
};

const getTypeValidator = (typeName) => {
    const key = normalizeTypeName(typeName);
    if (!key) return null;
    return registry[key] || null;
};

const listRegisteredTypes = () => Object.keys(registry);

const resolveTypeSpec = (rawType = 'void') => {
    let base = String(rawType || 'void').trim();
    let depth = 0;

    while (base.endsWith('[]')) {
        depth += 1;
        base = base.slice(0, -2).trim();
    }

    return {
        baseType: normalizeTypeName(base || 'void'),
        depth
    };
};

const typeSpecToString = (spec = {}) =>
    `${normalizeTypeName(spec.baseType)}${'[]'.repeat(Math.max(0, Number(spec.depth) || 0))}`;

const buildArrayValidator = (baseValidator, depth) => {
    if (depth === 0) return baseValidator;
    const childValidator = buildArrayValidator(baseValidator, depth - 1);
    return (value) => Array.isArray(value) && value.every((entry) => childValidator(entry));
};

const getValidatorForSpec = (spec = {}) => {
    const normalizedSpec = {
        baseType: normalizeTypeName(spec.baseType),
        depth: Math.max(0, Number(spec.depth) || 0)
    };

    const explicit = getTypeValidator(typeSpecToString(normalizedSpec));
    if (explicit) return explicit;

    const baseValidator = getTypeValidator(normalizedSpec.baseType);
    if (!baseValidator) return null;

    return buildArrayValidator(baseValidator, normalizedSpec.depth);
};

registerType('int', (value) => typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value));
registerType('long', (value) => typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value));
registerType('short', (value) => typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value));
registerType('byte', (value) => typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value));
registerType('float', (value) => typeof value === 'number' && Number.isFinite(value));
registerType('double', (value) => typeof value === 'number' && Number.isFinite(value));
registerType('number', (value) => typeof value === 'number' && Number.isFinite(value));
registerType('boolean', (value) => typeof value === 'boolean');
registerType('bool', (value) => typeof value === 'boolean');
registerType('string', (value) => typeof value === 'string');
registerType('char', (value) => typeof value === 'string' && value.length === 1);
registerType('void', (value) => value === null || value === undefined);

const typedArrayBases = ['int', 'long', 'short', 'byte', 'float', 'double', 'number', 'boolean', 'bool', 'string', 'char'];
typedArrayBases.forEach((baseType) => {
    const baseValidator = getTypeValidator(baseType);
    registerType(`${baseType}[]`, (value) => Array.isArray(value) && value.every((entry) => baseValidator(entry)));
    registerType(`${baseType}[][]`, (value) =>
        Array.isArray(value)
        && value.every((row) => Array.isArray(row) && row.every((entry) => baseValidator(entry)))
    );
});

module.exports = {
    TypeRegistry: registry,
    registerType,
    hasTypeValidator,
    getTypeValidator,
    listRegisteredTypes,
    resolveTypeSpec,
    typeSpecToString,
    getValidatorForSpec,
    normalizeTypeName
};
