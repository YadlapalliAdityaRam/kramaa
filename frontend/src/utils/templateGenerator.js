// Helper to generate boilerplate code for different languages based on parameters

const generateJavaScript = (className, functionName, returnType, parameters) => {
    let paramString = parameters.map(p => p.name).join(', ');

    // Generate JSDoc
    let javadoc = `/**\n`;
    parameters.forEach(p => {
        let type = p.type;
        if (p.is2D) type += '[][]';
        else if (p.isArray) type += '[]';
        // JS types: number, string, boolean
        if (type.includes('int') || type.includes('double')) type = type.replace('int', 'number').replace('double', 'number');
        javadoc += ` * @param {${type}} ${p.name}\n`;
    });

    let retType = returnType;
    if (retType.includes('int') || retType.includes('double')) retType = retType.replace('int', 'number').replace('double', 'number');
    javadoc += ` * @return {${retType}}\n */\n`;

    return `${javadoc}var ${functionName} = function(${paramString}) {\n    \n};\n`;
};

const generatePython = (className, functionName, returnType, parameters) => {
    const typeMap = {
        'int': 'int',
        'string': 'str',
        'boolean': 'bool',
        'double': 'float',
        'ListNode': 'Optional[ListNode]',
        'TreeNode': 'Optional[TreeNode]',
        'void': 'None'
    };

    let getPyType = (p) => {
        let base = typeMap[p.type] || p.type;
        if (p.is2D) return `List[List[${base}]]`;
        if (p.isArray) return `List[${base}]`;
        return base;
    };

    let paramList = ['self'];
    parameters.forEach(p => {
        paramList.push(`${p.name}: ${getPyType(p)}`);
    });

    let getRetType = (rt) => {
        if (!rt) return 'None';
        let base = typeMap[rt.replace('[]', '').replace('[][]', '')] || rt.replace('[]', '').replace('[][]', '');
        if (rt.includes('[][]')) return `List[List[${base}]]`;
        if (rt.includes('[]')) return `List[${base}]`;
        return base;
    };

    return `class ${className}:\n    def ${functionName}(${paramList.join(', ')}) -> ${getRetType(returnType)}:\n        \n        pass\n`;
};

const generateJava = (className, functionName, returnType, parameters) => {
    const typeMap = {
        'int': 'int',
        'string': 'String',
        'boolean': 'boolean',
        'double': 'double',
        'ListNode': 'ListNode',
        'TreeNode': 'TreeNode',
        'void': 'void'
    };

    let getJavaType = (p) => {
        let base = typeMap[p.type] || p.type;
        if (p.is2D) return `${base}[][]`;
        if (p.isArray) return `${base}[]`;
        return base;
    };

    let paramList = parameters.map(p => `${getJavaType(p)} ${p.name}`);

    let getRetType = (rt) => {
        let base = typeMap[rt.replace('[]', '').replace('[][]', '')] || rt.replace('[]', '').replace('[][]', '');
        if (rt.includes('[][]')) return `${base}[][]`;
        if (rt.includes('[]')) return `${base}[]`;
        return base;
    };

    return `class ${className} {\n    public ${getRetType(returnType)} ${functionName}(${paramList.join(', ')}) {\n        \n    }\n}\n`;
};

const generateCpp = (className, functionName, returnType, parameters) => {
    const typeMap = {
        'int': 'int',
        'string': 'string',
        'boolean': 'bool',
        'double': 'double',
        'ListNode': 'ListNode*',
        'TreeNode': 'TreeNode*',
        'void': 'void'
    };

    let getCppType = (p) => {
        let base = typeMap[p.type] || p.type;
        if (p.is2D) return `vector<vector<${base}>>`;
        if (p.isArray) return `vector<${base}>`;
        return base;
    };

    let paramList = parameters.map(p => {
        if (p.isArray || p.is2D || p.type === 'string') return `const ${getCppType(p)}& ${p.name}`;
        return `${getCppType(p)} ${p.name}`;
    });

    let getRetType = (rt) => {
        let base = typeMap[rt.replace('[]', '').replace('[][]', '')] || rt.replace('[]', '').replace('[][]', '');
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

const resolveTypeSpec = (rawType = 'void') => {
    let base = String(rawType || 'void').trim().toLowerCase();
    let depth = 0;
    while (base.endsWith('[]')) {
        depth += 1;
        base = base.slice(0, -2).trim();
    }
    return { baseType: base, depth };
};

const getCScalarType = (baseType) => {
    if (['int', 'long', 'short', 'byte'].includes(baseType)) return 'int';
    if (['double', 'float', 'number'].includes(baseType)) return 'double';
    if (['boolean', 'bool'].includes(baseType)) return 'bool';
    if (baseType === 'string') return 'char*';
    if (baseType === 'char') return 'char';
    if (baseType === 'void') return 'void';
    return 'int';
};

const getCTypeForDepth = (baseType, depth) => {
    const scalar = getCScalarType(baseType);
    if (depth <= 0) return scalar;
    if (baseType === 'string') return `char${'*'.repeat(depth + 1)}`;
    return `${scalar}${'*'.repeat(depth)}`;
};

const getParamDepth = (param) => {
    const parsed = resolveTypeSpec(param?.type || 'int');
    if (param?.is2D) return 2;
    if (param?.isArray) return 1;
    return parsed.depth;
};

const generateC = (className, functionName, returnType, parameters) => {
    const safeFunctionName = (functionName || 'solve').replace(/[^a-zA-Z0-9_]/g, '_') || 'solve';
    const returnSpec = resolveTypeSpec(returnType || 'void');
    const returnTypeC = getCTypeForDepth(returnSpec.baseType, returnSpec.depth);

    const signatureParts = [];
    (parameters || []).forEach((param, index) => {
        const rawName = String(param?.name || `arg${index + 1}`);
        const safeName = rawName.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[^a-zA-Z_]+/, '') || `arg${index + 1}`;
        const depth = getParamDepth(param);
        const baseType = resolveTypeSpec(param?.type || 'int').baseType;

        if (depth === 0) {
            signatureParts.push(`${getCTypeForDepth(baseType, 0)} ${safeName}`);
        } else if (depth === 1) {
            signatureParts.push(`${getCTypeForDepth(baseType, 1)} ${safeName}`, `int ${safeName}Size`);
        } else {
            signatureParts.push(
                `${getCTypeForDepth(baseType, 2)} ${safeName}`,
                `int ${safeName}Size`,
                `int* ${safeName}ColSize`
            );
        }
    });

    if (returnSpec.depth === 1) {
        signatureParts.push('int* returnSize');
    } else if (returnSpec.depth === 2) {
        signatureParts.push('int* returnSize', 'int** returnColumnSizes');
    }

    let defaultReturn = '';
    if (returnSpec.depth === 0) {
        if (returnSpec.baseType === 'void') defaultReturn = '    return;';
        else if (['int', 'long', 'short', 'byte'].includes(returnSpec.baseType)) defaultReturn = '    return 0;';
        else if (['double', 'float', 'number'].includes(returnSpec.baseType)) defaultReturn = '    return 0.0;';
        else if (['boolean', 'bool'].includes(returnSpec.baseType)) defaultReturn = '    return false;';
        else if (returnSpec.baseType === 'string') defaultReturn = '    return NULL;';
        else if (returnSpec.baseType === 'char') defaultReturn = "    return '\\0';";
        else defaultReturn = '    return 0;';
    } else if (returnSpec.depth === 1) {
        defaultReturn = '    *returnSize = 0;\n    return NULL;';
    } else {
        defaultReturn = '    *returnSize = 0;\n    *returnColumnSizes = NULL;\n    return NULL;';
    }

    return `#include <stdlib.h>\n#include <stdbool.h>\n\n${returnTypeC} ${safeFunctionName}(${signatureParts.join(', ') || 'void'}) {\n${defaultReturn}\n}\n`;
};

export const generateTemplates = (className, functionName, returnType, parameters) => {
    if (!functionName) return { javascript: '', python: '', java: '', cpp: '', c: '' };

    // Default safe values
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
