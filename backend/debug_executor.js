const codeExecutor = require('./services/codeExecutor');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const debug = async () => {
    try {
        console.log('Testing JS Execution...');
        const result = await codeExecutor.executeCode(
            'function twoSum(input) { return "0 1"; }',
            'javascript',
            '2\n2 7 11 15\n9',
            1000,
            { functionName: 'twoSum' }
        );
        console.log('Result:', result);
    } catch (err) {
        console.error('Execution Failed:', err);
    }
};

debug();
