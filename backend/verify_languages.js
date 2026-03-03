const codeExecutor = require('./services/codeExecutor');
const dotenv = require('dotenv');

dotenv.config();

const runTest = async (lang, code, input, functionName) => {
    console.log(`\n--- Testing ${lang} ---`);
    try {
        const result = await codeExecutor.executeCode(
            code,
            lang,
            input,
            2000,
            { functionName }
        );
        console.log('Status:', result.status);
        if (result.status === 'accepted') {
            console.log('Output:', result.stdout.trim());
            console.log(result.stdout.trim() === '0 1' ? 'PASS' : 'FAIL (Wrong Output)');
        } else {
            console.log('Error:', result.stderr);
            console.log('FAIL');
        }
    } catch (err) {
        console.error('Exception:', err);
    }
};

const main = async () => {
    const input = '4\n2 7 11 15\n9'; // n=4, nums=[2,7,11,15], target=9 -> indices 0 1

    // 1. JavaScript
    await runTest('javascript',
        `function twoSum(input) { return "0 1"; }`,
        input, 'twoSum');

    // 2. Python
    await runTest('python',
        `def twoSum(input_data): return "0 1"`,
        input, 'twoSum');

    // 3. Java
    await runTest('java',
        `import java.util.*;
class Solution {
    public String twoSum(String input) { return "0 1"; }
}`,
        input, 'twoSum');

    // 4. C++
    await runTest('cpp',
        `#include <iostream>
#include <string>
#include <vector>
#include <sstream>
using namespace std;

class Solution {
public:
    string twoSum(string input) { return "0 1"; }
};`,
        input, 'twoSum');

    // 5. C
    await runTest('c',
        `#include <stdlib.h>
#include <string.h>

char* twoSum(char* input) {
    // Return static string or malloc'd
    return "0 1"; 
}`,
        input, 'twoSum');
};

main();
