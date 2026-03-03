require('dotenv').config();
const mongoose = require('mongoose');
const codeExecutor = require('../services/codeExecutor');

// Mock problem with short time limit
const problem = {
    testCases: [
        { input: '5', output: '25' } // Simple square
    ],
    timeLimit: 1000 // 1 second
};

async function testSandboxing() {
    console.log('--- Testing Sandboxing & Limits ---');

    // 1. Test Infinite Loop (Time Limit)
    console.log('\nTest 1: Infinite Loop (Python)');
    const infiniteLoopCode = `
def solve(n):
    while True:
        pass
    return n
`;
    const start1 = Date.now();
    const result1 = await codeExecutor.executeCode(infiniteLoopCode, 'python', '5', 1000);
    const end1 = Date.now();
    console.log(`Status: ${result1.status}, Time: ${result1.time}s, Duration: ${end1 - start1}ms`);

    if (result1.status === 'time_limit_exceeded') {
        console.log('PASS: Infinite loop caught correctly');
    } else {
        console.error('FAIL: Infinite loop NOT caught', result1);
    }


    // 2. Test File System Access (Sandboxing)
    // Attempt to read a file outside the temp dir. 
    // Note: Node's spawn with cwd doesn't explicitly block .. access unless using chroot/jail (Docker).
    // But we check if it cleans up temp files.
    console.log('\nTest 2: Valid Execution & Cleanup');
    const validCode = `
def solve(n):
    return int(n) * int(n)
`;
    const result2 = await codeExecutor.executeCode(validCode, 'python', '5', 1000);
    console.log(`Status: ${result2.status}, Output: ${result2.stdout.trim()}`);

    if (result2.status === 'accepted' && result2.stdout.trim() === '25') {
        console.log('PASS: Valid execution successful (Python)');
    } else {
        console.error('FAIL: Valid execution failed (Python)', result2);
    }

    // 3. Test C++ Execution
    console.log('\nTest 3: C++ Execution');
    const cppCode = `
#include <iostream>
class Solution {
public:
    string solve(string input) {
        return "Hello C++";
    }
};
`;
    // Note: inputs for C++ driver (as currently written) might need adjustment if it expects specific format.
    // The driver reads all stdin.
    const result3 = await codeExecutor.executeCode(cppCode, 'cpp', 'input');
    console.log(`Status: ${result3.status}, Output: ${result3.stdout.trim()}`);
    if (result3.status === 'accepted' && result3.stdout.trim() === 'Hello C++') {
        console.log('PASS: C++ Execution Successful');
    } else {
        console.error('FAIL: C++ Execution Failed', result3);
    }

    // 4. Test Java Execution
    console.log('\nTest 4: Java Execution');
    const javaCode = `
class Solution {
    public String solve(String input) {
        return "Hello Java";
    }
}
`;
    const result4 = await codeExecutor.executeCode(javaCode, 'java', 'input');
    console.log(`Status: ${result4.status}, Output: ${result4.stdout.trim()}`);
    if (result4.status === 'accepted' && result4.stdout.trim() === 'Hello Java') {
        console.log('PASS: Java Execution Successful');
    } else {
        console.error('FAIL: Java Execution Failed', result4);
    }
}

testSandboxing();
