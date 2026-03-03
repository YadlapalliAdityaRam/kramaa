const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' }); // load from backend root
const Problem = require('../models/Problem');

const generateJavaScript = (className, functionName, returnType, parameters) => {
    let paramString = parameters.map(p => p.name).join(', ');
    let javadoc = `/**\n`;
    parameters.forEach(p => {
        let type = p.type;
        if (p.is2D) type += '[][]';
        else if (p.isArray) type += '[]';
        if (type.includes('int') || type.includes('double')) type = type.replace('int', 'number').replace('double', 'number');
        javadoc += ` * @param {${type}} ${p.name}\n`;
    });
    let retType = returnType;
    if (retType.includes('int') || retType.includes('double')) retType = retType.replace('int', 'number').replace('double', 'number');
    javadoc += ` * @return {${retType}}\n */\n`;
    return `${javadoc}var ${functionName} = function(${paramString}) {\n    \n};\n`;
};

const generatePython = (className, functionName, returnType, parameters) => {
    const typeMap = { 'string': 'str', 'void': 'None' };
    let paramList = ['self'];
    parameters.forEach(p => {
        paramList.push(`${p.name}: str`);
    });
    let retType = returnType === 'void' ? 'None' : 'str';
    return `class ${className}:\n    def ${functionName}(${paramList.join(', ')}) -> ${retType}:\n        \n        pass\n`;
};

const generateJava = (className, functionName, returnType, parameters) => {
    let paramList = parameters.map(p => `String ${p.name}`);
    let retType = returnType === 'void' ? 'void' : 'String';
    return `class ${className} {\n    public ${retType} ${functionName}(${paramList.join(', ')}) {\n        return "";\n    }\n}\n`;
};

const generateCpp = (className, functionName, returnType, parameters) => {
    let paramList = parameters.map(p => `const string& ${p.name}`);
    let retType = returnType === 'void' ? 'void' : 'string';
    return `class ${className} {\npublic:\n    ${retType} ${functionName}(${paramList.join(', ')}) {\n        return "";\n    }\n};\n`;
};

const generateC = (className, functionName, returnType, parameters) => {
    let retType = returnType === 'void' ? 'void' : 'char*';
    return `${retType} ${functionName}() {\n    return "";\n}\n`;
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
            let tc = null;
            if (prob.sampleTestCases && prob.sampleTestCases.length > 0) tc = prob.sampleTestCases[0];
            else if (prob.hiddenTestCases && prob.hiddenTestCases.length > 0) tc = prob.hiddenTestCases[0];

            if (tc) {
                // If the test case is already a JSON array, skip OR we might just assume it's string.
                // We'll parse it if it looks like a raw multiline string.
                if (!tc.input.startsWith('[')) {
                    // Split by newlines
                    let lines = tc.input.split('\n');
                    if (lines.length === 1 && tc.input.includes('\r\n')) {
                        lines = tc.input.split('\r\n');
                    }

                    // Create parameters
                    const numLines = lines.length;
                    let newParams = [];
                    for (let i = 0; i < numLines; i++) {
                        newParams.push({
                            name: `param${i + 1}`,
                            type: 'string',
                            isArray: false,
                            is2D: false
                        });
                    }
                    prob.parameters = newParams;
                    prob.returnType = 'string';

                    // Convert all testcases
                    let convertTc = (testCaseArr) => {
                        for (let t of testCaseArr) {
                            if (!t.input.startsWith('[')) {
                                let lns = t.input.split('\n');
                                if (lns.length === 1 && t.input.includes('\r\n')) lns = t.input.split('\r\n');
                                // PAD if necessary
                                while (lns.length < numLines) lns.push("");
                                // Trim overflow
                                lns = lns.slice(0, numLines);
                                t.input = JSON.stringify(lns);
                            }
                        }
                    };

                    if (prob.sampleTestCases) convertTc(prob.sampleTestCases);
                    if (prob.hiddenTestCases) convertTc(prob.hiddenTestCases);

                    // Re-generate templates
                    prob.starterCode = generateTemplates(prob.className, prob.functionName, prob.returnType, prob.parameters);

                    await prob.save();
                    console.log(`Updated problem: ${prob.title} with ${numLines} parameters.`);
                    updatedCount++;
                }
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
