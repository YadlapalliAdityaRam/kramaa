const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
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
    let paramList = ['self'];
    parameters.forEach(p => {
        let t = p.type === 'string' ? 'str' : 'int';
        if (p.is2D) t = `List[List[${t}]]`;
        else if (p.isArray) t = `List[${t}]`;
        paramList.push(`${p.name}: ${t}`);
    });
    let retType = returnType === 'void' ? 'None' : (returnType.includes('int') ? (returnType.includes('[][]') ? 'List[List[int]]' : (returnType.includes('[]') ? 'List[int]' : 'int')) : 'str');
    return `from typing import List\n\nclass ${className}:\n    def ${functionName}(${paramList.join(', ')}) -> ${retType}:\n        \n        pass\n`;
};

const generateJava = (className, functionName, returnType, parameters) => {
    let paramList = parameters.map(p => {
        let t = p.type === 'string' ? 'String' : 'int';
        if (p.is2D) t += '[][]';
        else if (p.isArray) t += '[]';
        return `${t} ${p.name}`;
    });
    let retType = returnType === 'void' ? 'void' : (returnType.replace('string', 'String'));
    return `class ${className} {\n    public ${retType} ${functionName}(${paramList.join(', ')}) {\n        ${returnType.includes('[]') ? 'return new ' + returnType.replace('string', 'String').replace('[]', '[0];') : (returnType === 'void' ? '' : (returnType === 'int' ? 'return 0;' : 'return "";'))}\n    }\n}\n`;
};

const generateCpp = (className, functionName, returnType, parameters) => {
    let paramList = parameters.map(p => {
        let t = p.type;
        if (p.is2D) t = `vector<vector<${t}>>`;
        else if (p.isArray) t = `vector<${t}>`;
        if (t.includes('string')) t = t.replace('string', 'std::string');
        return `const ${t}& ${p.name}`;
    });
    let retType = returnType;
    if (retType.includes('[][]')) retType = `vector<vector<${retType.replace('[][]', '')}>>`;
    else if (retType.includes('[]')) retType = `vector<${retType.replace('[]', '')}>`;
    if (retType.includes('string')) retType = retType.replace('string', 'std::string');
    return `#include <vector>\n#include <string>\nusing namespace std;\n\nclass ${className} {\npublic:\n    ${retType} ${functionName}(${paramList.join(', ')}) {\n        ${returnType.includes('[]') ? 'return {};' : (returnType === 'void' ? '' : (returnType === 'int' ? 'return 0;' : 'return "";'))}\n    }\n};\n`;
};

const generateTemplates = (className, functionName, returnType, parameters) => {
    return {
        javascript: generateJavaScript(className, functionName, returnType, parameters),
        python: generatePython(className, functionName, returnType, parameters),
        java: generateJava(className, functionName, returnType, parameters),
        cpp: generateCpp(className, functionName, returnType, parameters),
        c: ""
    };
};

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        for (let i = 1; i <= 5; i++) {
            const data = JSON.parse(fs.readFileSync(`./data${i}.json`, 'utf8'));
            for (let probData of data) {
                probData.starterCode = generateTemplates(probData.className, probData.functionName, probData.returnType, probData.parameters);

                // For test cases, convert single string inputs (the payload string has newlines for multiple params)
                // into a proper JSON array of strings
                const processTestCases = (tcases) => {
                    return tcases.map(tc => {
                        let lines = tc.input.split('\n');
                        if (lines.length === 1 && tc.input.includes('\r\n')) lines = tc.input.split('\r\n');
                        // Fill to parameter count length padding with empty string if necessary
                        while (lines.length < probData.parameters.length) lines.push("");
                        lines = lines.slice(0, probData.parameters.length);
                        return { ...tc, input: JSON.stringify(lines) };
                    });
                };

                probData.sampleTestCases = processTestCases(probData.sampleTestCases);
                probData.hiddenTestCases = processTestCases(probData.hiddenTestCases);

                await Problem.findOneAndUpdate({ title: probData.title }, probData, { upsert: true, new: true, overwrite: true });
                console.log(`Imported / Updated Problem: ${probData.title}`);
            }
        }
        console.log('Import Complete!');
        process.exit(0);
    } catch (e) {
        console.error('Import Failed', e);
        process.exit(1);
    }
};

run();
