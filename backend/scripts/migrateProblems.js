const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' }); // load from backend root
const Problem = require('../models/Problem');

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

    return `class ${className} {\npublic:\n    ${getRetType(returnType)} ${functionName}(${paramList.join(', ')}) {\n        \n    }\n};\n`;
};

const generateC = (className, functionName, returnType, parameters) => {
    return `// Note: C templates are basic. Arrays require length parameters.\n${returnType} ${functionName}() {\n    \n}\n`;
};

const generateTemplates = (className, functionName, returnType, parameters) => {
    if (!functionName) return { javascript: '', python: '', java: '', cpp: '', c: '' };
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

const migrate = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!uri) {
            console.error('MONGODB_URI is missing');
            process.exit(1);
        }
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const problems = await Problem.find({});
        console.log(`Found ${problems.length} problems`);

        let updatedCount = 0;

        for (const prob of problems) {
            let needsUpdate = false;

            if (!prob.className) {
                prob.className = 'Solution';
                needsUpdate = true;
            }
            if (!prob.functionName || prob.functionName === '') {
                prob.functionName = 'solve';
                needsUpdate = true;
            }
            if (!prob.returnType) {
                prob.returnType = 'string';
                needsUpdate = true;
            }

            if (!prob.parameters || prob.parameters.length === 0) {
                // If there are no parameters, and it has test cases, let's infer the type.
                // Usually existing problems just take a raw string input.
                // So we'll define a single string parameter.
                prob.parameters = [{
                    name: 'inputData',
                    type: 'string',
                    isArray: false,
                    is2D: false
                }];
                needsUpdate = true;
            }

            if (!prob.starterCode || !prob.starterCode.javascript) {
                // Generate default templates if not present?
                // The prompt says "make sure update all problems with above features", so we should probably populate starter code.
                const templates = generateTemplates(prob.className, prob.functionName, prob.returnType, prob.parameters);

                prob.starterCode = {
                    ...(prob.starterCode || {}),
                    ...templates
                };
                needsUpdate = true;
            }

            if (needsUpdate) {
                await prob.save();
                console.log(`Updated problem: ${prob.title} (${prob.slug})`);
                updatedCount++;
            }
        }

        console.log(`Migration complete. Updated ${updatedCount} problems.`);
        process.exit(0);

    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
