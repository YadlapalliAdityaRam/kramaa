const LANGUAGE_KEYS = ['javascript', 'python', 'java', 'cpp', 'c'];
const { generateCStarterCode } = require('./cLeetCodeDriver');

const generateJavaScript = (className, functionName, returnType, parameters) => {
    const paramString = parameters.map((p) => p.name).join(', ');

    let javadoc = '/**\n';
    parameters.forEach((p) => {
        let type = p.type;
        if (p.is2D) type += '[][]';
        else if (p.isArray) type += '[]';
        if (type.includes('int') || type.includes('double')) {
            type = type.replace('int', 'number').replace('double', 'number');
        }
        javadoc += ` * @param {${type}} ${p.name}\n`;
    });

    let retType = returnType;
    if (retType.includes('int') || retType.includes('double')) {
        retType = retType.replace('int', 'number').replace('double', 'number');
    }
    javadoc += ` * @return {${retType}}\n */\n`;

    return `${javadoc}var ${functionName} = function(${paramString}) {\n    \n};\n`;
};

const generatePython = (className, functionName, returnType, parameters) => {
    const typeMap = {
        int: 'int',
        string: 'str',
        boolean: 'bool',
        double: 'float',
        ListNode: 'Optional[ListNode]',
        TreeNode: 'Optional[TreeNode]',
        void: 'None'
    };

    const getPyType = (p) => {
        const base = typeMap[p.type] || p.type;
        if (p.is2D) return `List[List[${base}]]`;
        if (p.isArray) return `List[${base}]`;
        return base;
    };

    const paramList = ['self'];
    parameters.forEach((p) => {
        paramList.push(`${p.name}: ${getPyType(p)}`);
    });

    const getRetType = (rt) => {
        if (!rt) return 'None';
        const baseType = rt.replace('[]', '').replace('[][]', '');
        const base = typeMap[baseType] || baseType;
        if (rt.includes('[][]')) return `List[List[${base}]]`;
        if (rt.includes('[]')) return `List[${base}]`;
        return base;
    };

    return `class ${className}:\n    def ${functionName}(${paramList.join(', ')}) -> ${getRetType(returnType)}:\n        \n        pass\n`;
};

const generateJava = (className, functionName, returnType, parameters) => {
    const typeMap = {
        int: 'int',
        string: 'String',
        boolean: 'boolean',
        double: 'double',
        ListNode: 'ListNode',
        TreeNode: 'TreeNode',
        void: 'void'
    };

    const getJavaType = (p) => {
        const base = typeMap[p.type] || p.type;
        if (p.is2D) return `${base}[][]`;
        if (p.isArray) return `${base}[]`;
        return base;
    };

    const paramList = parameters.map((p) => `${getJavaType(p)} ${p.name}`);

    const getRetType = (rt) => {
        const baseType = rt.replace('[]', '').replace('[][]', '');
        const base = typeMap[baseType] || baseType;
        if (rt.includes('[][]')) return `${base}[][]`;
        if (rt.includes('[]')) return `${base}[]`;
        return base;
    };

    return `class ${className} {\n    public ${getRetType(returnType)} ${functionName}(${paramList.join(', ')}) {\n        \n    }\n}\n`;
};

const generateCpp = (className, functionName, returnType, parameters) => {
    const typeMap = {
        int: 'int',
        string: 'string',
        boolean: 'bool',
        double: 'double',
        ListNode: 'ListNode*',
        TreeNode: 'TreeNode*',
        void: 'void'
    };

    const getCppType = (p) => {
        const base = typeMap[p.type] || p.type;
        if (p.is2D) return `vector<vector<${base}>>`;
        if (p.isArray) return `vector<${base}>`;
        return base;
    };

    const paramList = parameters.map((p) => {
        if (p.isArray || p.is2D || p.type === 'string') {
            return `const ${getCppType(p)}& ${p.name}`;
        }
        return `${getCppType(p)} ${p.name}`;
    });

    const getRetType = (rt) => {
        const baseType = rt.replace('[]', '').replace('[][]', '');
        const base = typeMap[baseType] || baseType;
        if (rt.includes('[][]')) return `vector<vector<${base}>>`;
        if (rt.includes('[]')) return `vector<${base}>`;
        return base;
    };

    const cppReturnType = getRetType(returnType);
    let defaultReturnLine = '';

    if (cppReturnType !== 'void') {
        if (cppReturnType.startsWith('vector<')) {
            defaultReturnLine = '        return {};';
        } else if (cppReturnType === 'string') {
            defaultReturnLine = '        return "";';
        } else if (cppReturnType === 'bool') {
            defaultReturnLine = '        return false;';
        } else if (cppReturnType === 'double') {
            defaultReturnLine = '        return 0.0;';
        } else if (cppReturnType.endsWith('*')) {
            defaultReturnLine = '        return nullptr;';
        } else {
            defaultReturnLine = '        return 0;';
        }
    }

    return `#include <vector>\n#include <string>\nusing namespace std;\n\nclass ${className} {\npublic:\n    ${cppReturnType} ${functionName}(${paramList.join(', ')}) {\n${defaultReturnLine ? `${defaultReturnLine}\n` : ''}    }\n};\n`;
};

const generateC = (className, functionName, returnType, parameters) => {
    try {
        return generateCStarterCode({
            className,
            functionName,
            returnType,
            parameters
        });
    } catch (error) {
        return `#include <stdlib.h>\n#include <stdbool.h>\n\n/* C template fallback: ${error.message} */\nint ${functionName || 'solve'}(void) {\n    return 0;\n}\n`;
    }
};

const generateTemplates = (className, functionName, returnType, parameters) => {
    if (!functionName) {
        return { javascript: '', python: '', java: '', cpp: '', c: '' };
    }

    const safeClass = className || 'Solution';
    const safeRet = returnType || 'void';
    const safeParams = parameters || [];

    return {
        javascript: generateJavaScript(safeClass, functionName, safeRet, safeParams),
        python: generatePython(safeClass, functionName, safeRet, safeParams),
        java: generateJava(safeClass, functionName, safeRet, safeParams),
        cpp: generateCpp(safeClass, functionName, safeRet, safeParams),
        c: generateC(safeClass, functionName, safeRet, safeParams)
    };
};

const shouldKeepExistingStarter = (lang, starter) => {
    if (typeof starter !== 'string' || starter.trim().length === 0) return false;
    if (lang !== 'c') return true;

    const normalized = starter.toLowerCase();
    const hasLegacyPlaceholder = normalized.includes('c templates are basic');
    const hasLegacyJsonContract = /char\s*\*\s*[A-Za-z_][A-Za-z0-9_]*\s*\(\s*char\s*\*\s*input\s*\)/.test(starter);

    return !hasLegacyPlaceholder && !hasLegacyJsonContract;
};

const resolveStarterCode = ({ starterCode, className, functionName, returnType, parameters }) => {
    const generated = generateTemplates(
        className || 'Solution',
        functionName || 'solve',
        returnType || 'void',
        parameters || []
    );

    const resolved = {};
    LANGUAGE_KEYS.forEach((lang) => {
        const current = starterCode?.[lang];
        resolved[lang] = shouldKeepExistingStarter(lang, current)
            ? current
            : generated[lang];
    });

    return resolved;
};

module.exports = {
    generateTemplates,
    resolveStarterCode
};
